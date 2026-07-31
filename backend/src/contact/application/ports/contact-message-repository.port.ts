import { ContactSubmission } from '../../domain/contact-submission';

export const CONTACT_MESSAGE_REPOSITORY = Symbol('CONTACT_MESSAGE_REPOSITORY');

export type PersistedContactMessage = {
  id: string;
};

export type ClaimedContactNotification = {
  id: string;
  submission: ContactSubmission;
  attempt: number;
};

export type ClaimedSubmittedContactNotification = {
  id: string;
  messageId: string;
  submittedAt: Date;
};

export interface ContactMessageRepositoryPort {
  save(submission: ContactSubmission): Promise<PersistedContactMessage>;
  deleteExpired(before: Date): Promise<{
    messages: number;
    webhookEvents: number;
  }>;
  claimPendingNotifications(params: {
    limit: number;
    now: Date;
    leaseMs: number;
  }): Promise<ClaimedContactNotification[]>;
  claimSubmittedNotifications(params: {
    limit: number;
    now: Date;
    leaseMs: number;
  }): Promise<ClaimedSubmittedContactNotification[]>;
  markNotificationSubmitted(params: {
    id: string;
    messageId: string;
    submittedAt: Date;
    nextCheckAt: Date;
  }): Promise<void>;
  markNotificationDelivered(params: {
    id: string;
    messageId: string;
    deliveredAt: Date;
  }): Promise<void>;
  rescheduleSubmittedNotificationCheck(params: {
    id: string;
    nextAttemptAt: Date;
    error?: string;
  }): Promise<void>;
  findNotificationIdByMessageId(messageId: string): Promise<string | null>;
  markNotificationFailed(params: {
    id: string;
    error: string;
    nextAttemptAt?: Date;
    messageId?: string;
  }): Promise<void>;
  recordWebhookEvent(params: {
    webhookId: string;
    provider: string;
    eventType: string;
    contactMessageId?: string;
    messageId?: string;
    eventCreatedAt: Date;
  }): Promise<'recorded' | 'duplicate'>;
}
