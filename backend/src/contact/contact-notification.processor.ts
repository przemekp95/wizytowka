import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { contactConfig } from '../config';
import {
  CONTACT_MESSAGE_REPOSITORY,
  type ClaimedContactNotification,
  type ClaimedSubmittedContactNotification,
  type ContactMessageRepositoryPort,
} from './application/ports/contact-message-repository.port';
import {
  ContactNotificationError,
  CONTACT_NOTIFICATION_SENDER_PORT,
  CONTACT_NOTIFICATION_STATUS_PORT,
  type ContactNotificationSenderPort,
  type ContactNotificationStatusPort,
} from './application/ports/contact-notification.port';
import { ContactNotificationConfirmationService } from './contact-notification-confirmation.service';

@Injectable()
export class ContactNotificationProcessor {
  private readonly logger = new Logger(ContactNotificationProcessor.name);

  constructor(
    @Inject(CONTACT_MESSAGE_REPOSITORY)
    private readonly repository: ContactMessageRepositoryPort,
    @Inject(CONTACT_NOTIFICATION_SENDER_PORT)
    private readonly notificationSender: ContactNotificationSenderPort,
    @Inject(contactConfig.KEY)
    private readonly contactConfiguration: ConfigType<typeof contactConfig>,
    private readonly notificationConfirmation: ContactNotificationConfirmationService,
    @Optional()
    @Inject(CONTACT_NOTIFICATION_STATUS_PORT)
    private readonly notificationStatus?: ContactNotificationStatusPort,
  ) {}

  async processPendingNotifications(): Promise<number> {
    const now = new Date();
    const claimed = await this.repository.claimPendingNotifications({
      limit: this.contactConfiguration.notificationDispatchBatchSize,
      now,
      leaseMs: this.contactConfiguration.notificationLeaseMs,
    });

    for (const notification of claimed) {
      await this.processClaimedNotification(notification);
    }

    const remainingCapacity = Math.max(
      0,
      this.contactConfiguration.notificationDispatchBatchSize - claimed.length,
    );
    let reconciled = 0;

    if (this.notificationStatus && remainingCapacity > 0) {
      const submitted = await this.repository.claimSubmittedNotifications({
        limit: remainingCapacity,
        now,
        leaseMs: this.contactConfiguration.notificationLeaseMs,
      });

      for (const notification of submitted) {
        await this.processSubmittedNotification(notification);
      }

      reconciled = submitted.length;
    }

    return claimed.length + reconciled;
  }

  private async processClaimedNotification(
    notification: ClaimedContactNotification,
  ): Promise<void> {
    try {
      const result = await this.notificationSender.send({
        submission: notification.submission,
        deliveryKey: notification.id,
      });
      const outcome = await this.notificationConfirmation.recordDispatchOutcome(
        {
          id: notification.id,
          messageId: result.messageId,
          deliveryState: result.deliveryState,
          observedAt: new Date(),
        },
      );

      if (outcome === 'submitted') {
        this.logger.log(
          `Queued contact notification submitted to provider. id=${notification.id} attempt=${notification.attempt} messageId=${result.messageId}`,
        );
      } else {
        this.logger.log(
          `Queued contact notification delivered. id=${notification.id} attempt=${notification.attempt} messageId=${result.messageId}`,
        );
      }
    } catch (error) {
      const deliveryError =
        error instanceof Error ? error : new Error(String(error));
      const shouldRetry =
        !(deliveryError instanceof ContactNotificationError) ||
        deliveryError.retryable;
      const nextAttemptAt =
        !shouldRetry ||
        notification.attempt >=
          this.contactConfiguration.notificationMaxAttempts
          ? undefined
          : new Date(
              Date.now() + this.computeRetryDelayMs(notification.attempt),
            );

      await this.repository.markNotificationFailed({
        id: notification.id,
        error: deliveryError.message,
        nextAttemptAt,
      });

      if (nextAttemptAt) {
        this.logger.warn(
          `Queued contact notification failed. id=${notification.id} attempt=${notification.attempt} nextAttemptAt=${nextAttemptAt.toISOString()} reason=${deliveryError.message}`,
        );
        return;
      }

      this.logger.error(
        `Queued contact notification exhausted retries. id=${notification.id} attempt=${notification.attempt} reason=${deliveryError.message}`,
      );
    }
  }

  private async processSubmittedNotification(
    notification: ClaimedSubmittedContactNotification,
  ): Promise<void> {
    if (!this.notificationStatus) {
      this.logger.warn(
        `Queued contact notification confirmation skipped because no status adapter is configured. id=${notification.id} messageId=${notification.messageId}`,
      );
      return;
    }

    try {
      const status = await this.notificationStatus.lookup(
        notification.messageId,
      );
      const outcome =
        await this.notificationConfirmation.reconcileSubmittedNotification({
          notification,
          observedAt: new Date(),
          status,
        });

      switch (outcome.outcome) {
        case 'delivered':
          this.logger.log(
            `Queued contact notification confirmed as delivered. id=${notification.id} messageId=${notification.messageId}`,
          );
          return;

        case 'failed':
          this.logger.warn(
            `Queued contact notification confirmed as failed. id=${notification.id} messageId=${notification.messageId} reason=${outcome.reason}`,
          );
          return;

        case 'timed_out':
          this.logger.warn(
            `Queued contact notification confirmation timed out. id=${notification.id} messageId=${notification.messageId} reason=${outcome.reason}`,
          );
          return;

        default:
          if (outcome.reason) {
            this.logger.warn(
              `Queued contact notification confirmation lookup failed. id=${notification.id} messageId=${notification.messageId} reason=${outcome.reason}`,
            );
            return;
          }

          this.logger.debug(
            `Queued contact notification still awaiting confirmation. id=${notification.id} messageId=${notification.messageId}`,
          );
      }
    } catch (error) {
      const lookupError =
        error instanceof Error ? error : new Error(String(error));
      const outcome =
        await this.notificationConfirmation.reconcileSubmittedNotification({
          notification,
          observedAt: new Date(),
          lookupError,
        });

      if (outcome.outcome === 'timed_out') {
        this.logger.warn(
          `Queued contact notification confirmation timed out after lookup failure. id=${notification.id} messageId=${notification.messageId} reason=${outcome.reason}`,
        );
        return;
      }

      this.logger.warn(
        `Queued contact notification confirmation lookup failed. id=${notification.id} messageId=${notification.messageId} reason=${outcome.outcome === 'rescheduled' ? (outcome.reason ?? lookupError.message) : lookupError.message}`,
      );
    }
  }

  private computeRetryDelayMs(attempt: number): number {
    return Math.min(
      this.contactConfiguration.notificationBaseDelayMs *
        Math.pow(2, Math.max(0, attempt - 1)),
      this.contactConfiguration.notificationMaxDelayMs,
    );
  }
}
