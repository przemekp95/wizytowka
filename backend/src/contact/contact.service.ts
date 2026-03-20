import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  CONTACT_MESSAGE_REPOSITORY,
  type ContactMessageRepositoryPort,
} from './application/ports/contact-message-repository.port';
import {
  CONTACT_NOTIFICATION_PORT,
  type ContactNotificationPort,
} from './application/ports/contact-notification.port';
import {
  ContactSubmission,
  type ContactSubmissionProps,
} from './domain/contact-submission';

export type CreateContactInput = ContactSubmissionProps;

export type CreateContactResult =
  | {
      ok: true;
      messageId: string;
      savedId: string;
    }
  | {
      ok: false;
      error: string;
      savedId?: string;
    };

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    @Inject(CONTACT_MESSAGE_REPOSITORY)
    private readonly repository: ContactMessageRepositoryPort,
    @Inject(CONTACT_NOTIFICATION_PORT)
    private readonly notifier: ContactNotificationPort,
  ) {}

  async sendMail(params: CreateContactInput): Promise<{ messageId: string }> {
    return this.notifier.send(ContactSubmission.create(params));
  }

  async createAndNotify(
    params: CreateContactInput,
  ): Promise<CreateContactResult> {
    const submission = ContactSubmission.create(params);

    try {
      const saved = await this.repository.save(submission);
      const savedId = saved.id;

      try {
        const { messageId } = await this.notifier.send(submission);
        return { ok: true, messageId, savedId };
      } catch (error) {
        const deliveryError =
          error instanceof Error ? error : new Error(String(error));
        this.logger.error(
          `Mail send failed. requestId=${submission.requestId} savedId=${savedId} reason=${deliveryError.message}`,
        );

        return {
          ok: false,
          error:
            'Nie udalo sie dostarczyc wiadomosci. Sprobuj ponownie pozniej.',
          savedId,
        };
      }
    } catch (error) {
      const saveError =
        error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `DB save failed. requestId=${submission.requestId} reason=${saveError.message}`,
      );

      return {
        ok: false,
        error: 'Nie udalo sie zapisac wiadomosci. Sprobuj ponownie pozniej.',
      };
    }
  }
}
