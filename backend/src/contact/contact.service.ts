import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  CONTACT_MESSAGE_REPOSITORY,
  type ContactMessageRepositoryPort,
} from './application/ports/contact-message-repository.port';
import {
  ContactSubmission,
  type ContactSubmissionProps,
} from './domain/contact-submission';
import {
  CONTACT_NOTIFICATION_DISPATCH_PORT,
  type ContactNotificationDispatchPort,
} from './application/ports/contact-notification-dispatch.port';

export type CreateContactInput = ContactSubmissionProps;

export type ContactSubmissionFailureCode = 'contact_persistence_failed';

export type CreateContactResult =
  | {
      ok: true;
      savedId: string;
    }
  | {
      ok: false;
      failureCode: ContactSubmissionFailureCode;
    };

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    @Inject(CONTACT_MESSAGE_REPOSITORY)
    private readonly repository: ContactMessageRepositoryPort,
    @Inject(CONTACT_NOTIFICATION_DISPATCH_PORT)
    private readonly notificationDispatch: ContactNotificationDispatchPort,
  ) {}

  async createAndQueueNotification(
    params: CreateContactInput,
  ): Promise<CreateContactResult> {
    const submission = ContactSubmission.create(params);

    try {
      const saved = await this.repository.save(submission);
      try {
        this.notificationDispatch.kick();
      } catch (error) {
        this.logger.warn(
          `Queued contact notification dispatch trigger failed. savedId=${saved.id} reason=${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }

      return {
        ok: true,
        savedId: saved.id,
      };
    } catch (error) {
      const saveError =
        error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `DB save failed. requestId=${submission.requestId} reason=${saveError.message}`,
      );

      return {
        ok: false,
        failureCode: 'contact_persistence_failed',
      };
    }
  }
}
