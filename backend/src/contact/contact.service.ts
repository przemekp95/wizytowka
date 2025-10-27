import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { Transporter, SentMessageInfo } from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';

interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

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

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(private readonly prisma: PrismaService) {}

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

  async createAndNotify(params: CreateContactInput): Promise<{
    ok: true;
    messageId?: string;
    savedId?: string;
  }> {
    let savedId: string | undefined;

    try {
      const saved = await this.prisma.contactMessage.create({
        data: {
          name: params.name,
          email: params.email,
          message: params.message,
          ip: params.ip ?? null,
        },
        select: { id: true },
      });
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
