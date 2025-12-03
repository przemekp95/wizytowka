import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { Transporter, SentMessageInfo } from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Options for configuring retry logic with exponential backoff
 */
interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

/**
 * Converts various value types to boolean
 * @param v - Value to convert
 * @returns Boolean representation of the input value
 */
function toBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v === 1;
  if (typeof v === 'string') {
    const s = v.toLowerCase().trim();
    return s === 'true' || s === '1' || s === 'yes' || s === 'ssl';
  }
  return false;
}

export type CreateContactInput = {
  name: string;
  email: string;
  message: string;
  ip?: string;
  requestId?: string;
  hcaptchaToken?: string;
};

/**
 * Service responsible for handling contact form submissions,
 * email notifications, and database persistence.
 *
 * Features:
 * - SMTP email sending with retry logic
 * - Database persistence with graceful degradation
 * - Request tracking and logging
 */
@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  /**
   * @param prisma - Database service for data persistence
   */
  constructor(private readonly prisma: PrismaService) {}

  /**
   * SMTP transporter configured with environment variables.
   * Uses connection pooling and rate limiting for optimal delivery.
   */
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  private transporter: Transporter = nodemailer.createTransport(
    {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 465),
      secure: toBool(process.env.SMTP_SECURE ?? true),
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      connectionTimeout: 30_000,
      greetingTimeout: 30_000,
      socketTimeout: 60_000,
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 5,
    },
    {
      logger: toBool(process.env.SMTP_DEBUG ?? false),
      debug: toBool(process.env.SMTP_DEBUG ?? false),
    },
  );

  /**
   * Executes an operation with exponential backoff retry logic
   * @template T - Return type of the operation
   * @param operation - Async function to retry on failure
   * @param options - Retry configuration options
   * @param requestId - Optional request identifier for logging
   * @returns Promise resolving to the operation result
   * @throws Last error encountered if all retries are exhausted
   */
  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    options: RetryOptions,
    requestId?: string,
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          this.logger.warn(
            `Retry attempt ${attempt}/${options.maxRetries} for requestId=${requestId}`,
          );
        }

        return await operation();
      } catch (error) {
        lastError =
          (error as unknown) instanceof Error
            ? (error as unknown as Error)
            : new Error(String(error));

        if (attempt === options.maxRetries) {
          break;
        }

        const delay = Math.min(
          options.baseDelay * Math.pow(2, attempt),
          options.maxDelay,
        );

        this.logger.warn(
          `Email send failed (attempt ${attempt + 1}), retrying in ${delay}ms. ` +
            `Error: ${lastError.message} requestId=${requestId}`,
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  /**
   * Sends an email notification with contact form data using SMTP
   * @param params - Contact form input data
   * @returns Promise resolving to object containing messageId
   * @throws Error if SMTP configuration is missing or sending fails
   */
  async sendMail(params: CreateContactInput): Promise<{ messageId: string }> {
    const from = process.env.SMTP_FROM || process.env.SMTP_USER || '';
    const to = process.env.SMTP_TO || process.env.SMTP_USER || '';

    if (!process.env.SMTP_HOST || !from || !to) {
      throw new Error('Brak konfiguracji SMTP (HOST/FROM/TO)');
    }

    const lines: string[] = [
      `Imię i nazwisko: ${params.name}`,
      `E-mail: ${params.email}`,
      params.ip ? `IP: ${params.ip}` : '',
      params.requestId ? `Request-Id: ${params.requestId}` : '',
      '---',
      params.message,
    ].filter(Boolean);

    const retryOptions: RetryOptions = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
    };

    const result = await this.retryWithBackoff(
      async () => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        const info = await this.transporter.sendMail({
          from,
          to,
          replyTo: params.email,
          subject: `Wiadomość ze strony – ${params.name}`,
          text: lines.join('\n'),
          headers: { 'X-Request-Id': params.requestId ?? '' },
        });

        // Type guard to ensure info is SentMessageInfo
        if (info && typeof info === 'object' && 'messageId' in info) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const sentInfo = info as SentMessageInfo;

          this.logger.log(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            `Mail sent successfully: messageId=${sentInfo.messageId} ` +
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              `accepted=${JSON.stringify(sentInfo.accepted)} ` +
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              `rejected=${JSON.stringify(sentInfo.rejected)} req=${params.requestId}`,
          );

          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          return { messageId: sentInfo.messageId };
        } else {
          throw new Error('Invalid response from sendMail');
        }
      },
      retryOptions,
      params.requestId,
    );

    return result;
  }

  /**
   * Saves contact message to database and sends email notification.
   * Uses graceful degradation - if database save fails, email is still sent.
   * If email fails, the message may still be saved in database.
   *
   * @param params - Contact form input data including hCaptcha token
   * @returns Promise resolving to operation result with IDs and status
   */
  async createAndNotify(params: CreateContactInput): Promise<{
    ok: true;
    messageId?: string;
    savedId?: string;
  }> {
    let savedId: string | undefined;

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const saved = await this.prisma.contactMessage.create({
        data: {
          name: params.name,
          email: params.email,
          message: params.message,
          ip: params.ip ?? null,
        },
        select: { id: true },
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      savedId = saved.id;
    } catch (e) {
      const error =
        (e as unknown) instanceof Error
          ? (e as unknown as Error)
          : new Error(String(e));
      this.logger.warn(
        `DB save failed, continuing. requestId=${params.requestId} reason=${error.message}`,
      );
    }

    try {
      const { messageId } = await this.sendMail(params);
      return { ok: true, messageId, savedId };
    } catch (e) {
      const error =
        (e as unknown) instanceof Error
          ? (e as unknown as Error)
          : new Error(String(e));
      this.logger.error(
        `Mail send failed. requestId=${params.requestId} reason=${error.message}`,
      );
      return { ok: true, savedId };
    }
  }
}
