import 'reflect-metadata';
import { setWorldConstructor } from '@cucumber/cucumber';
import { INestApplication } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { type ContactMessageRepositoryPort } from '../../src/contact/application/ports/contact-message-repository.port';
import { type ContactNotificationPort } from '../../src/contact/application/ports/contact-notification.port';
import { type ChatCompletionPort } from '../../src/chat/application/ports/chat-completion.port';
import { type ChatContextPort } from '../../src/chat/application/ports/chat-context.port';
import { type ChatSessionIdPort } from '../../src/chat/application/ports/chat-session-id.port';
import { type ChatSessionStorePort } from '../../src/chat/application/ports/chat-session-store.port';
import { chatConfig } from '../../src/config';

export type BehaviorResponse = {
  status: number;
  body: unknown;
};

export class BehaviorWorld {
  app?: INestApplication;
  response?: BehaviorResponse;

  persistenceCalls = 0;
  notificationCalls = 0;
  persistenceShouldFail = false;
  notificationShouldFail = false;

  contextCalls = 0;
  completionCalls = 0;

  readonly chatConfiguration: ConfigType<typeof chatConfig> = {
    apiKey: 'test-key',
    enabled: true,
    model: 'gpt-3.5-turbo',
    maxTokens: 500,
    temperature: 0.7,
    sessionMaxAgeMs: 24 * 60 * 60 * 1000,
  };

  readonly repository: ContactMessageRepositoryPort = {
    save: async () => {
      this.persistenceCalls += 1;

      if (this.persistenceShouldFail) {
        throw new Error('Database connection failed');
      }

      return { id: 'saved-123' };
    },
  };

  readonly notifier: ContactNotificationPort = {
    send: async () => {
      this.notificationCalls += 1;

      if (this.notificationShouldFail) {
        throw new Error('SMTP failure');
      }

      return { messageId: 'msg-123' };
    },
  };

  readonly completionPort: ChatCompletionPort = {
    complete: async () => {
      this.completionCalls += 1;

      return {
        content: 'Jasne, moge pomoc.',
      };
    },
  };

  readonly contextPort: ChatContextPort = {
    buildSystemPrompt: async () => {
      this.contextCalls += 1;

      return 'SYSTEM PROMPT';
    },
  };

  readonly sessionStore: ChatSessionStorePort = {
    load: async () => null,
    save: async () => undefined,
    deleteExpired: async () => undefined,
  };

  readonly sessionIdPort: ChatSessionIdPort = {
    next: () => 'chat-session-1',
  };
}

setWorldConstructor(BehaviorWorld);
