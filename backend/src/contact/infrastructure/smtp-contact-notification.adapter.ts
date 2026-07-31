import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import nodemailer from 'nodemailer';
import { contactConfig } from '../../config';
import type {
  ContactNotificationRequest,
  ContactNotificationSenderPort,
  SentContactNotification,
} from '../application/ports/contact-notification.port';
import { ContactNotificationError } from '../application/ports/contact-notification.port';

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
    messageId: string;
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
export class SmtpContactNotificationAdapter implements ContactNotificationSenderPort {
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

  async send({
    submission,
    deliveryKey,
  }: ContactNotificationRequest): Promise<SentContactNotification> {
    const from =
      this.contactConfiguration.smtpFrom ??
      this.contactConfiguration.smtpUser ??
      '';
    const to =
      this.contactConfiguration.smtpTo ??
      this.contactConfiguration.smtpUser ??
      '';

    if (!this.contactConfiguration.smtpHost || !from || !to) {
      throw new ContactNotificationError(
        'Brak konfiguracji SMTP (HOST/FROM/TO)',
        false,
      );
    }

    const lines: string[] = [
      `Imię i nazwisko: ${submission.name}`,
      `E-mail: ${submission.email}`,
      submission.ip ? `IP: ${submission.ip}` : '',
      submission.requestId ? `Request-Id: ${submission.requestId}` : '',
      '---',
      submission.message,
    ].filter(Boolean);

    const transporter = this.getTransporter();
    const messageId = this.buildStableMessageId(deliveryKey, from);
    const info = await transporter.sendMail({
      from,
      to,
      replyTo: submission.email,
      subject: `Wiadomość ze strony – ${submission.name}`,
      text: lines.join('\n'),
      messageId,
      headers: {
        'X-Request-Id': submission.requestId ?? '',
        'X-Contact-Delivery-Key': deliveryKey,
      },
    });

    this.logger.log(
      `Mail sent successfully: messageId=${messageId} ` +
        `accepted=${JSON.stringify(info.accepted)} ` +
        `rejected=${JSON.stringify(info.rejected)} req=${submission.requestId}`,
    );

    return {
      messageId,
      deliveryState: 'delivered',
    };
  }
  private buildStableMessageId(deliveryKey: string, from: string): string {
    const sanitizedKey = deliveryKey.replace(/[^a-zA-Z0-9_.-]/g, '-');
    const domainMatch = from.match(/@([^>\s]+)/);
    const sanitizedDomain = (domainMatch?.[1] ?? 'localhost')
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '');

    return `<contact-${sanitizedKey}@${sanitizedDomain || 'localhost'}>`;
  }
}
