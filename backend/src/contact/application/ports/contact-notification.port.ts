import { ContactSubmission } from '../../domain/contact-submission';

export const CONTACT_NOTIFICATION_PORT = Symbol('CONTACT_NOTIFICATION_PORT');

export type SentContactNotification = {
  messageId: string;
};

export interface ContactNotificationPort {
  send(submission: ContactSubmission): Promise<SentContactNotification>;
}
