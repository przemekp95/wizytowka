import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { contactConfig } from '../config';
import type {
  ClaimedSubmittedContactNotification,
  ContactMessageRepositoryPort,
} from './application/ports/contact-message-repository.port';
import { CONTACT_MESSAGE_REPOSITORY } from './application/ports/contact-message-repository.port';
import type {
  ContactNotificationDeliveryStatus,
  SentContactNotification,
} from './application/ports/contact-notification.port';
import { ContactNotification } from './domain/contact-notification';

export type SubmittedNotificationConfirmationOutcome =
  | { outcome: 'delivered' }
  | { outcome: 'failed'; reason: string }
  | { outcome: 'timed_out'; reason: string }
  | { outcome: 'rescheduled'; reason?: string };

export type ContactWebhookApplicationOutcome =
  | { outcome: 'delivered' }
  | { outcome: 'failed' }
  | { outcome: 'duplicate' }
  | { outcome: 'unmatched' }
  | { outcome: 'missing_message_id' }
  | { outcome: 'ignored' };

@Injectable()
export class ContactNotificationConfirmationService {
  constructor(
    @Inject(CONTACT_MESSAGE_REPOSITORY)
    private readonly repository: ContactMessageRepositoryPort,
    @Inject(contactConfig.KEY)
    private readonly contactConfiguration: ConfigType<typeof contactConfig>,
  ) {}

  async recordDispatchOutcome(params: {
    id: string;
    messageId: string;
    deliveryState: SentContactNotification['deliveryState'];
    observedAt: Date;
  }): Promise<SentContactNotification['deliveryState']> {
    const decision = ContactNotification.pending(
      params.id,
    ).recordDispatchOutcome({
      messageId: params.messageId,
      deliveryState: params.deliveryState,
      observedAt: params.observedAt,
      submittedRecheckMs:
        this.contactConfiguration.notificationSubmittedRecheckMs,
    });

    if (decision.outcome === 'submitted') {
      await this.repository.markNotificationSubmitted({
        id: params.id,
        messageId: decision.messageId,
        submittedAt: decision.submittedAt,
        nextCheckAt: decision.nextCheckAt,
      });

      return 'submitted';
    }

    await this.repository.markNotificationDelivered({
      id: params.id,
      messageId: decision.messageId,
      deliveredAt: decision.deliveredAt,
    });

    return 'delivered';
  }

  async reconcileSubmittedNotification(params: {
    notification: ClaimedSubmittedContactNotification;
    observedAt: Date;
    status?: ContactNotificationDeliveryStatus;
    lookupError?: Error;
  }): Promise<SubmittedNotificationConfirmationOutcome> {
    const decision = ContactNotification.submitted(
      params.notification,
    ).reconcileSubmittedDelivery({
      observedAt: params.observedAt,
      submittedTimeoutMs:
        this.contactConfiguration.notificationSubmittedTimeoutMs,
      submittedRecheckMs:
        this.contactConfiguration.notificationSubmittedRecheckMs,
      status: params.status,
      lookupError: params.lookupError,
    });

    switch (decision.outcome) {
      case 'delivered':
        await this.repository.markNotificationDelivered({
          id: params.notification.id,
          messageId: decision.messageId,
          deliveredAt: decision.deliveredAt,
        });

        return {
          outcome: 'delivered',
        };

      case 'failed':
        await this.repository.markNotificationFailed({
          id: params.notification.id,
          error: decision.reason,
          messageId: decision.messageId,
        });

        return {
          outcome: 'failed',
          reason: decision.reason,
        };

      case 'timed_out':
        await this.repository.markNotificationFailed({
          id: params.notification.id,
          error: decision.reason,
          messageId: decision.messageId,
        });

        return {
          outcome: 'timed_out',
          reason: decision.reason,
        };

      default:
        await this.repository.rescheduleSubmittedNotificationCheck({
          id: params.notification.id,
          nextAttemptAt: decision.nextCheckAt,
          ...(decision.reason ? { error: decision.reason } : {}),
        });

        return {
          outcome: 'rescheduled',
          ...(decision.reason ? { reason: decision.reason } : {}),
        };
    }
  }

  async recordWebhookAndApply(params: {
    webhookId: string;
    provider: string;
    eventType: string;
    contactMessageId?: string | null;
    messageId?: string;
    eventCreatedAt: Date;
    failureReason?: string;
  }): Promise<ContactWebhookApplicationOutcome> {
    const recorded = await this.repository.recordWebhookEvent({
      webhookId: params.webhookId,
      provider: params.provider,
      eventType: params.eventType,
      contactMessageId: params.contactMessageId ?? undefined,
      messageId: params.messageId,
      eventCreatedAt: params.eventCreatedAt,
    });

    if (recorded === 'duplicate') {
      return {
        outcome: 'duplicate',
      };
    }

    const targetId = await this.resolveNotificationId({
      contactMessageId: params.contactMessageId,
      messageId: params.messageId,
    });

    if (!targetId) {
      return {
        outcome: 'unmatched',
      };
    }

    const decision = ContactNotification.pending(targetId).applyWebhook({
      eventType: params.eventType,
      messageId: params.messageId,
      deliveredAt: params.eventCreatedAt,
      failureReason: params.failureReason,
    });

    switch (decision.outcome) {
      case 'delivered':
        await this.repository.markNotificationDelivered({
          id: targetId,
          messageId: decision.messageId,
          deliveredAt: decision.deliveredAt,
        });

        return {
          outcome: 'delivered',
        };

      case 'failed':
        await this.repository.markNotificationFailed({
          id: targetId,
          error: decision.reason,
          ...(decision.messageId ? { messageId: decision.messageId } : {}),
        });

        return {
          outcome: 'failed',
        };

      case 'missing_message_id':
        return {
          outcome: 'missing_message_id',
        };

      default:
        return {
          outcome: 'ignored',
        };
    }
  }

  private async resolveNotificationId(params: {
    contactMessageId?: string | null;
    messageId?: string;
  }): Promise<string | null> {
    if (params.contactMessageId) {
      return params.contactMessageId;
    }

    if (!params.messageId) {
      return null;
    }

    return this.repository.findNotificationIdByMessageId(params.messageId);
  }
}
