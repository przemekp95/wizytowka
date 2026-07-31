import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Webhook } from 'svix';
import { contactConfig } from '../../config';
import { ContactNotificationConfirmationService } from '../contact-notification-confirmation.service';

type ResendWebhookEvent = {
  type: string;
  created_at: string;
  data: {
    email_id?: string;
    tags?: Record<string, string> | Array<{ name: string; value: string }>;
    failed?: {
      reason?: string;
    };
    bounce?: {
      message?: string;
      subType?: string;
      type?: string;
    };
    suppressed?: {
      message?: string;
      type?: string;
    };
  };
};

@Injectable()
export class ResendContactWebhookService {
  private readonly logger = new Logger(ResendContactWebhookService.name);

  constructor(
    private readonly notificationConfirmation: ContactNotificationConfirmationService,
    @Inject(contactConfig.KEY)
    private readonly contactConfiguration: ConfigType<typeof contactConfig>,
  ) {}

  async handleWebhook(params: {
    payload: string;
    headers: {
      id?: string;
      timestamp?: string;
      signature?: string;
    };
  }): Promise<void> {
    const webhookSecret = this.contactConfiguration.resendWebhookSecret;

    if (!webhookSecret) {
      throw new ServiceUnavailableException(
        'Resend webhook secret is not configured',
      );
    }

    const headerId = params.headers.id?.trim();
    const headerTimestamp = params.headers.timestamp?.trim();
    const headerSignature = params.headers.signature?.trim();

    if (!headerId || !headerTimestamp || !headerSignature) {
      throw new BadRequestException('Missing Resend webhook signature headers');
    }

    const event = this.verifyWebhook(
      params.payload,
      {
        'svix-id': headerId,
        'svix-timestamp': headerTimestamp,
        'svix-signature': headerSignature,
      },
      webhookSecret,
    );
    const contactMessageId = this.extractContactMessageId(event.data.tags);
    const messageId = event.data.email_id?.trim();
    const eventCreatedAt = new Date(event.created_at);

    const outcome = await this.notificationConfirmation.recordWebhookAndApply({
      webhookId: headerId,
      provider: 'resend',
      eventType: event.type,
      contactMessageId,
      messageId,
      eventCreatedAt: Number.isNaN(eventCreatedAt.getTime())
        ? new Date()
        : eventCreatedAt,
      failureReason: this.extractFailureReason(event),
    });

    switch (outcome.outcome) {
      case 'unmatched':
        this.logger.warn(
          `Resend webhook could not be matched to a contact message. type=${event.type} messageId=${messageId ?? 'unknown'}`,
        );
        return;

      case 'missing_message_id':
        this.logger.warn(
          `Resend delivered webhook missing email_id for contactMessageId=${contactMessageId ?? 'unknown'}`,
        );
        return;

      case 'ignored':
        this.logger.debug(
          `Ignoring Resend webhook event type=${event.type} messageId=${messageId ?? 'unknown'}`,
        );
        return;

      default:
        return;
    }
  }

  private verifyWebhook(
    payload: string,
    headers: {
      'svix-id': string;
      'svix-timestamp': string;
      'svix-signature': string;
    },
    webhookSecret: string,
  ): ResendWebhookEvent {
    try {
      const webhook = new Webhook(webhookSecret);

      return webhook.verify(payload, headers) as ResendWebhookEvent;
    } catch {
      throw new BadRequestException('Invalid Resend webhook signature');
    }
  }

  private extractContactMessageId(
    tags: ResendWebhookEvent['data']['tags'],
  ): string | null {
    if (!tags) {
      return null;
    }

    if (Array.isArray(tags)) {
      return (
        tags.find((tag) => tag.name === 'contact_message_id')?.value ?? null
      );
    }

    return tags.contact_message_id ?? null;
  }

  private extractFailureReason(event: ResendWebhookEvent): string {
    switch (event.type) {
      case 'email.failed':
        return event.data.failed?.reason ?? 'email.failed';
      case 'email.bounced':
        return (
          event.data.bounce?.message ??
          event.data.bounce?.subType ??
          event.data.bounce?.type ??
          'email.bounced'
        );
      case 'email.suppressed':
        return (
          event.data.suppressed?.message ??
          event.data.suppressed?.type ??
          'email.suppressed'
        );
      default:
        return event.type;
    }
  }
}
