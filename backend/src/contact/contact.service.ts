/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */

import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';

function toBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v === 1;
  if (typeof v === 'string') {
    const s = v.toLowerCase().trim();
    return s === 'true' || s === '1' || s === 'yes' || s === 'ssl';
  }
  return false;
}

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  private transporter: Transporter = nodemailer.createTransport(
    {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 465),
      secure: toBool(process.env.SMTP_SECURE ?? true),
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      connectionTimeout: 15_000,
      greetingTimeout: 15_000,
      socketTimeout: 20_000,
    },
    {
      logger: toBool(process.env.SMTP_DEBUG ?? false),
      debug: toBool(process.env.SMTP_DEBUG ?? false),
    },
  );

  async sendMail(params: {
    name: string;
    email: string;
    message: string;
    ip?: string;
    requestId?: string;
    hcaptchaToken?: string;
  }): Promise<{ messageId: string }> {
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

    const plain = lines.join('\n');

    const info = await this.transporter.sendMail({
      from,
      to,
      replyTo: params.email,
      subject: `Wiadomość ze strony – ${params.name}`,
      text: plain,
      headers: { 'X-Request-Id': params.requestId ?? '' },
    });

    this.logger.log(
      `Mail sent: messageId=${info.messageId} accepted=${JSON.stringify(
        info.accepted,
      )} rejected=${JSON.stringify(info.rejected)} req=${params.requestId}`,
    );

    return { messageId: info.messageId };
  }
}
