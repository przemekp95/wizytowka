import assert from 'node:assert/strict';
import {
  After,
  Before,
  Given,
  Then,
  When,
  setDefaultTimeout,
} from '@cucumber/cucumber';
import {
  INestApplication,
  Module,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { createValidationPipe } from '../../src/app.bootstrap';
import {
  CONTACT_MESSAGE_REPOSITORY,
} from '../../src/contact/application/ports/contact-message-repository.port';
import {
  CONTACT_NOTIFICATION_PORT,
} from '../../src/contact/application/ports/contact-notification.port';
import { ContactController } from '../../src/contact/contact.controller';
import { ContactService } from '../../src/contact/contact.service';
import { BehaviorWorld } from './behavior.world';

@Module({
  controllers: [ContactController],
  providers: [
    ContactService,
    {
      provide: CONTACT_MESSAGE_REPOSITORY,
      useValue: {},
    },
    {
      provide: CONTACT_NOTIFICATION_PORT,
      useValue: {},
    },
  ],
})
class ContactBehaviorTestModule {}

setDefaultTimeout(30_000);

Before({ tags: '@contact' }, async function (this: BehaviorWorld) {
  this.response = undefined;
  this.persistenceCalls = 0;
  this.notificationCalls = 0;
  this.persistenceShouldFail = false;
  this.notificationShouldFail = false;

  const moduleRef = await Test.createTestingModule({
    imports: [ContactBehaviorTestModule],
  })
    .overrideProvider(CONTACT_MESSAGE_REPOSITORY)
    .useValue(this.repository)
    .overrideProvider(CONTACT_NOTIFICATION_PORT)
    .useValue(this.notifier)
    .compile();

  this.app = moduleRef.createNestApplication();
  this.app.setGlobalPrefix('api');
  this.app.useGlobalPipes(createValidationPipe());
  await this.app.init();
});

After({ tags: '@contact' }, async function (this: BehaviorWorld) {
  await this.app?.close();
});

Given('contact persistence succeeds', function (this: BehaviorWorld) {
  this.persistenceShouldFail = false;
});

Given('contact notification succeeds', function (this: BehaviorWorld) {
  this.notificationShouldFail = false;
});

Given('contact notification fails', function (this: BehaviorWorld) {
  this.notificationShouldFail = true;
});

When(
  'I submit a valid public contact message',
  async function (this: BehaviorWorld) {
    const response = await request(this.app!.getHttpServer())
      .post('/api/contact')
      .send({
        name: 'Jan Testowy',
        email: 'jan@example.com',
        message: 'To jest poprawna wiadomosc testowa.',
      });

    this.response = {
      status: response.status,
      body: response.body,
    };
  },
);

When(
  'I submit an invalid public contact message',
  async function (this: BehaviorWorld) {
    const response = await request(this.app!.getHttpServer())
      .post('/api/contact')
      .send({
        name: 'J',
        email: 'wrong-email',
        message: 'short',
      });

    this.response = {
      status: response.status,
      body: response.body,
    };
  },
);

Then(
  'the contact response status should be {int}',
  function (this: BehaviorWorld, expectedStatus: number) {
    assert.equal(this.response?.status, expectedStatus);
  },
);

Then(
  'the contact response body should be:',
  function (this: BehaviorWorld, expectedBody: string) {
    assert.deepEqual(this.response?.body, JSON.parse(expectedBody));
  },
);

Then(
  'no contact persistence or notification should run',
  function (this: BehaviorWorld) {
    assert.equal(this.persistenceCalls, 0);
    assert.equal(this.notificationCalls, 0);
  },
);
