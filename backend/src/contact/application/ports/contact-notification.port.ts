import { ContactSubmission } from '../../domain/contact-submission';

export const CONTACT_NOTIFICATION_SENDER_PORT = Symbol(
  'CONTACT_NOTIFICATION_SENDER_PORT',
);
export const CONTACT_NOTIFICATION_STATUS_PORT = Symbol(
  'CONTACT_NOTIFICATION_STATUS_PORT',
);

export type ContactNotificationRequest = {
  submission: ContactSubmission;
  deliveryKey: string;
};

export class ContactNotificationError extends Error {
  constructor(
    message: string,
    public readonly retryable: boolean,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = 'ContactNotificationError';
  }
}

export type SentContactNotification = {
  messageId: string;
  deliveryState: 'submitted' | 'delivered';
};

export type ContactNotificationDeliveryStatus = {
  deliveryState: 'submitted' | 'delivered' | 'failed';
  failureReason?: string;
};

export interface ContactNotificationSenderPort {
  send(request: ContactNotificationRequest): Promise<SentContactNotification>;
}

export interface ContactNotificationStatusPort {
  lookup(messageId: string): Promise<ContactNotificationDeliveryStatus>;
}
