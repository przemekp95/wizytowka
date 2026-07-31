import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { contactConfig } from '../../config';
import type {
  ContactNotificationDeliveryStatus,
  ContactNotificationRequest,
  ContactNotificationSenderPort,
  ContactNotificationStatusPort,
  SentContactNotification,
} from '../application/ports/contact-notification.port';
import { ContactNotificationError } from '../application/ports/contact-notification.port';

type ResendSendEmailSuccess = {
  id: string;
};

type ResendErrorResponse = {
  name?: string;
  message?: string;
};

type ResendEmailDetails = {
  last_event?: string;
};

@Injectable()
export class ResendContactNotificationAdapter
  implements ContactNotificationSenderPort, ContactNotificationStatusPort
{
  constructor(
    @Inject(contactConfig.KEY)
    private readonly contactConfiguration: ConfigType<typeof contactConfig>,
  ) {}

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
    const apiKey = this.contactConfiguration.resendApiKey;

    if (!apiKey) {
      throw new ContactNotificationError(
        'Brak konfiguracji Resend API key',
        false,
      );
    }

    if (!from || !to) {
      throw new ContactNotificationError(
        'Brak konfiguracji nadawcy lub odbiorcy dla Resend',
        false,
      );
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `contact-message/${deliveryKey}`,
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: submission.email,
        subject: `Wiadomość ze strony – ${submission.name}`,
        text: this.buildPlainTextBody(submission),
        headers: {
          'X-Request-Id': submission.requestId ?? '',
          'X-Contact-Delivery-Key': deliveryKey,
        },
        tags: [
          {
            name: 'contact_message_id',
            value: deliveryKey,
          },
          ...(submission.requestId
            ? [
                {
                  name: 'contact_request_id',
                  value: submission.requestId.replace(/[^a-zA-Z0-9_-]/g, '-'),
                },
              ]
            : []),
        ],
      }),
    });

    if (!response.ok) {
      throw await this.toNotificationError(response);
    }

    const data = (await response.json()) as ResendSendEmailSuccess;

    return {
      messageId: data.id,
      deliveryState: 'submitted',
    };
  }

  async lookup(messageId: string): Promise<ContactNotificationDeliveryStatus> {
    const apiKey = this.contactConfiguration.resendApiKey;

    if (!apiKey) {
      throw new ContactNotificationError(
        'Brak konfiguracji Resend API key',
        false,
      );
    }

    const response = await fetch(
      `https://api.resend.com/emails/${encodeURIComponent(messageId)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );

    if (!response.ok) {
      throw await this.toNotificationError(response);
    }

    const data = (await response.json()) as ResendEmailDetails;

    return this.mapDeliveryStatus(data.last_event);
  }

  private buildPlainTextBody(
    submission: ContactNotificationRequest['submission'],
  ): string {
    return [
      `Imię i nazwisko: ${submission.name}`,
      `E-mail: ${submission.email}`,
      submission.ip ? `IP: ${submission.ip}` : '',
      submission.requestId ? `Request-Id: ${submission.requestId}` : '',
      '---',
      submission.message,
    ]
      .filter(Boolean)
      .join('\n');
  }

  private async toNotificationError(
    response: Response,
  ): Promise<ContactNotificationError> {
    const body = (await response.json().catch(() => undefined)) as
      | ResendErrorResponse
      | undefined;
    const message =
      body?.message ??
      `Resend API request failed with status ${response.status}`;
    const errorName = body?.name?.toLowerCase();

    const retryable =
      response.status === 404 ||
      response.status === 429 ||
      response.status >= 500 ||
      errorName === 'concurrent_idempotent_requests';

    return new ContactNotificationError(message, retryable);
  }

  private mapDeliveryStatus(
    lastEvent: string | undefined,
  ): ContactNotificationDeliveryStatus {
    switch (lastEvent) {
      case 'delivered':
      case 'opened':
      case 'clicked':
      case 'complained':
        return {
          deliveryState: 'delivered',
        };

      case 'bounced':
      case 'failed':
      case 'suppressed':
      case 'canceled':
        return {
          deliveryState: 'failed',
          failureReason: `Provider status: ${lastEvent}`,
        };

      default:
        return {
          deliveryState: 'submitted',
        };
    }
  }
}
