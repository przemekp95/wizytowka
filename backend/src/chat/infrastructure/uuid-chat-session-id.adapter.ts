import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import type { ChatSessionIdPort } from '../application/ports/chat-session-id.port';

@Injectable()
export class UuidChatSessionIdAdapter implements ChatSessionIdPort {
  next(): string {
    return uuidv4();
  }
}
