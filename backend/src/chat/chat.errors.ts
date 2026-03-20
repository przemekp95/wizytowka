import { ServiceUnavailableException } from '@nestjs/common';

export class ChatUnavailableException extends ServiceUnavailableException {
  constructor() {
    super({
      error: 'Chat is unavailable because OPENAI_API_KEY is not configured.',
      code: 'CHAT_UNAVAILABLE',
    });
  }
}
