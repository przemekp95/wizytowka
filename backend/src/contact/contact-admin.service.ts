import { Inject, Injectable } from '@nestjs/common';
import {
  CONTACT_MESSAGE_READ_PORT,
  type ContactMessageReadPort,
  type ListContactMessagesResult,
} from './application/ports/contact-message-read.port';

export type ListContactMessagesInput = {
  limit: number;
  cursor?: string;
};

export type { ListContactMessagesResult } from './application/ports/contact-message-read.port';

@Injectable()
export class ContactAdminService {
  constructor(
    @Inject(CONTACT_MESSAGE_READ_PORT)
    private readonly readPort: ContactMessageReadPort,
  ) {}

  async listMessages({
    limit,
    cursor,
  }: ListContactMessagesInput): Promise<ListContactMessagesResult> {
    return this.readPort.listMessages({
      limit: Math.max(1, Math.min(limit || 20, 100)),
      cursor,
    });
  }
}
