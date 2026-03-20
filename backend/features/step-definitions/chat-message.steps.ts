import assert from 'node:assert/strict';
import {
  After,
  Before,
  Given,
  Then,
  When,
  setDefaultTimeout,
} from '@cucumber/cucumber';
import { Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { createValidationPipe } from '../../src/app.bootstrap';
import {
  CHAT_COMPLETION_PORT,
} from '../../src/chat/application/ports/chat-completion.port';
import {
  CHAT_CONTEXT_PORT,
} from '../../src/chat/application/ports/chat-context.port';
import {
  CHAT_SESSION_ID_PORT,
} from '../../src/chat/application/ports/chat-session-id.port';
import {
  CHAT_SESSION_STORE_PORT,
} from '../../src/chat/application/ports/chat-session-store.port';
import { ChatController } from '../../src/chat/chat.controller';
import { ChatService } from '../../src/chat/chat.service';
import { chatConfig } from '../../src/config';
import { BehaviorWorld } from './behavior.world';

@Module({
  controllers: [ChatController],
  providers: [
    ChatService,
    {
      provide: CHAT_COMPLETION_PORT,
      useValue: {},
    },
    {
      provide: CHAT_CONTEXT_PORT,
      useValue: {},
    },
    {
      provide: CHAT_SESSION_STORE_PORT,
      useValue: {},
    },
    {
      provide: CHAT_SESSION_ID_PORT,
      useValue: {},
    },
    {
      provide: chatConfig.KEY,
      useValue: {},
    },
  ],
})
class ChatBehaviorTestModule {}

setDefaultTimeout(30_000);

Before({ tags: '@chat' }, async function (this: BehaviorWorld) {
  this.response = undefined;
  this.contextCalls = 0;
  this.completionCalls = 0;
  this.chatConfiguration.apiKey = 'test-key';
  this.chatConfiguration.enabled = true;

  const moduleRef = await Test.createTestingModule({
    imports: [ChatBehaviorTestModule],
  })
    .overrideProvider(CHAT_COMPLETION_PORT)
    .useValue(this.completionPort)
    .overrideProvider(CHAT_CONTEXT_PORT)
    .useValue(this.contextPort)
    .overrideProvider(CHAT_SESSION_STORE_PORT)
    .useValue(this.sessionStore)
    .overrideProvider(CHAT_SESSION_ID_PORT)
    .useValue(this.sessionIdPort)
    .overrideProvider(chatConfig.KEY)
    .useValue(this.chatConfiguration)
    .compile();

  this.app = moduleRef.createNestApplication();
  this.app.setGlobalPrefix('api');
  this.app.useGlobalPipes(createValidationPipe());
  await this.app.init();
});

After({ tags: '@chat' }, async function (this: BehaviorWorld) {
  await this.app?.close();
});

Given('chat is enabled', function (this: BehaviorWorld) {
  this.chatConfiguration.enabled = true;
  this.chatConfiguration.apiKey = 'test-key';
});

Given('chat is disabled', function (this: BehaviorWorld) {
  this.chatConfiguration.enabled = false;
  this.chatConfiguration.apiKey = undefined;
});

Given('chat completion succeeds', function () {
  return undefined;
});

When('I submit a valid chat message', async function (this: BehaviorWorld) {
  const response = await request(this.app!.getHttpServer())
    .post('/api/chat/message')
    .send({
      message: 'Opowiedz o portfolio',
    });

  this.response = {
    status: response.status,
    body: response.body,
  };
});

When('I submit an invalid chat message', async function (this: BehaviorWorld) {
  const response = await request(this.app!.getHttpServer())
    .post('/api/chat/message')
    .send({
      message: '',
      sessionId:
        'too-long-too-long-too-long-too-long-too-long-too-long-too-long-too-long-too-long-too-long-too-long',
    });

  this.response = {
    status: response.status,
    body: response.body,
  };
});

Then(
  'the chat response status should be {int}',
  function (this: BehaviorWorld, expectedStatus: number) {
    assert.equal(this.response?.status, expectedStatus);
  },
);

Then(
  'the chat response body should be:',
  function (this: BehaviorWorld, expectedBody: string) {
    assert.deepEqual(this.response?.body, JSON.parse(expectedBody));
  },
);

Then(
  'no chat context or completion should run',
  function (this: BehaviorWorld) {
    assert.equal(this.contextCalls, 0);
    assert.equal(this.completionCalls, 0);
  },
);
