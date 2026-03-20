import { ContactSubmission } from '../../domain/contact-submission';

export const CONTACT_MESSAGE_REPOSITORY = Symbol('CONTACT_MESSAGE_REPOSITORY');

export type PersistedContactMessage = {
  id: string;
};

export interface ContactMessageRepositoryPort {
  save(submission: ContactSubmission): Promise<PersistedContactMessage>;
}
