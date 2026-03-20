import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import nodemailer from 'nodemailer';
import { contactConfig } from '../../config';
import { ContactSubmission } from '../domain/contact-submission';
import type {
  ContactNotificationPort,
  SentContactNotification,
} from '../application/ports/contact-notification.port';

interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

type SentMailResult = {
  messageId: string;
  accepted?: unknown;
  rejected?: unknown;
};

type MailTransporter = {
  sendMail: (options: {
    from: string;
    to: string;
    replyTo: string;
    subject: string;
    text: string;
    headers: Record<string, string>;
  }) => Promise<SentMailResult>;
};

type NodemailerModule = {
  createTransport: (
    transportOptions: Record<string, unknown>,
    defaults: Record<string, unknown>,
  ) => MailTransporter;
};

@Injectable()
export class SmtpContactNotificationAdapter implements ContactNotificationPort {
  private readonly logger = new Logger(SmtpContactNotificationAdapter.name);
  private readonly nodemailerModule = nodemailer as unknown as NodemailerModule;
  private transporter: MailTransporter | null = null;

  constructor(
    @Inject(contactConfig.KEY)
    private readonly contactConfiguration: ConfigType<typeof contactConfig>,
  ) {}

  private getTransporter(): MailTransporter {
    if (this.transporter) {
      return this.transporter;
    }

    const auth =
      this.contactConfiguration.smtpUser && this.contactConfiguration.smtpPass
        ? {
            user: this.contactConfiguration.smtpUser,
            pass: this.contactConfiguration.smtpPass,
          }
        : undefined;

    this.transporter = this.nodemailerModule.createTransport(
      {
        host: this.contactConfiguration.smtpHost,
        port: this.contactConfiguration.smtpPort,
        secure: this.contactConfiguration.smtpSecure,
        auth,
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
        logger: this.contactConfiguration.smtpDebug,
        debug: this.contactConfiguration.smtpDebug,
      },
    );

    return this.transporter;
  }

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
        lastError = error instanceof Error ? error : new Error(String(error));

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

  async send(submission: ContactSubmission): Promise<SentContactNotification> {
    const from =
      this.contactConfiguration.smtpFrom ??
      this.contactConfiguration.smtpUser ??
      '';
    const to =
      this.contactConfiguration.smtpTo ??
      this.contactConfiguration.smtpUser ??
      '';

    if (!this.contactConfiguration.smtpHost || !from || !to) {
      throw new Error('Brak konfiguracji SMTP (HOST/FROM/TO)');
    }

    const lines: string[] = [
      `Imię i nazwisko: ${submission.name}`,
      `E-mail: ${submission.email}`,
      submission.ip ? `IP: ${submission.ip}` : '',
      submission.requestId ? `Request-Id: ${submission.requestId}` : '',
      '---',
      submission.message,
    ].filter(Boolean);

    const info = await this.retryWithBackoff(
      async () => {
        const transporter = this.getTransporter();

        return transporter.sendMail({
          from,
          to,
          replyTo: submission.email,
          subject: `Wiadomość ze strony – ${submission.name}`,
          text: lines.join('\n'),
          headers: { 'X-Request-Id': submission.requestId ?? '' },
        });
      },
      {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 10_000,
      },
      submission.requestId,
    );

    this.logger.log(
      `Mail sent successfully: messageId=${info.messageId} ` +
        `accepted=${JSON.stringify(info.accepted)} ` +
        `rejected=${JSON.stringify(info.rejected)} req=${submission.requestId}`,
    );

    return { messageId: info.messageId };
  }
}
