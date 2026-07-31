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
import type { ConfigType } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { createValidationPipe } from '../../src/app.bootstrap';
import { GqlThrottleStorageService } from '../../src/common/guards/gql-throttle-storage.service';
import { ContactHttpThrottlerGuard } from '../../src/common/guards/public-http-throttler.guard';
import {
  appConfig,
  contactConfig,
  mongoConfig,
  throttleConfig,
} from '../../src/config';
import { CONTACT_MESSAGE_REPOSITORY } from '../../src/contact/application/ports/contact-message-repository.port';
import { CONTACT_NOTIFICATION_DISPATCH_PORT } from '../../src/contact/application/ports/contact-notification-dispatch.port';
import { CONTACT_NOTIFICATION_SENDER_PORT } from '../../src/contact/application/ports/contact-notification.port';
import { ContactController } from '../../src/contact/contact.controller';
import { ContactDataRetentionService } from '../../src/contact/contact-data-retention.service';
import { ContactService } from '../../src/contact/contact.service';
import { BehaviorWorld } from './behavior.world';

@Module({
  controllers: [ContactController],
  providers: [
    ContactService,
    GqlThrottleStorageService,
    ContactHttpThrottlerGuard,
    {
      provide: CONTACT_MESSAGE_REPOSITORY,
      useValue: {},
    },
    {
      provide: CONTACT_NOTIFICATION_SENDER_PORT,
      useValue: {},
    },
    {
      provide: CONTACT_NOTIFICATION_DISPATCH_PORT,
      useValue: {
        kick: () => undefined,
      },
    },
    {
      provide: contactConfig.KEY,
      useValue: {
        notificationProvider: 'smtp',
        smtpHost: 'smtp.test.local',
        smtpPort: 465,
        smtpSecure: true,
        smtpFrom: 'from@test.local',
        smtpTo: 'to@test.local',
        smtpUser: undefined,
        smtpPass: undefined,
        smtpDebug: false,
        resendApiKey: undefined,
        resendWebhookSecret: undefined,
        notificationDispatchEnabled: false,
        notificationDispatchIntervalMs: 1000,
        notificationDispatchBatchSize: 10,
        notificationLeaseMs: 30000,
        notificationMaxAttempts: 5,
        notificationBaseDelayMs: 30000,
        notificationMaxDelayMs: 900000,
        notificationSubmittedRecheckMs: 300000,
        notificationSubmittedTimeoutMs: 86400000,
        dataRetentionEnabled: false,
        dataRetentionMs: 90 * 24 * 60 * 60_000,
        retentionSweepIntervalMs: 60 * 60_000,
      },
    },
    {
      provide: appConfig.KEY,
      useValue: {
        internalProxySharedSecret: undefined,
      },
    },
    {
      provide: throttleConfig.KEY,
      useValue: {
        driver: 'memory',
        disabled: false,
        limit: 30,
        ttlMs: 60_000,
        publicHttpLimit: 30,
        publicHttpTtlMs: 60_000,
        chatHttpLimit: 20,
        chatHttpTtlMs: 60_000,
        chatHttpGlobalLimit: 100,
        chatHttpGlobalTtlMs: 60_000,
      },
    },
    {
      provide: mongoConfig.KEY,
      useValue: {
        uri: undefined,
        dbName: 'wizytowka',
      },
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
  this.contactRetentionDays = 90;
  this.deletedContactDataBefore = undefined;

  const moduleRef = await Test.createTestingModule({
    imports: [ContactBehaviorTestModule],
  })
    .overrideProvider(CONTACT_MESSAGE_REPOSITORY)
    .useValue(this.repository)
    .overrideProvider(CONTACT_NOTIFICATION_SENDER_PORT)
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

Given('contact persistence fails', function (this: BehaviorWorld) {
  this.persistenceShouldFail = true;
});

Given(
  'contact data is retained for {int} days',
  function (this: BehaviorWorld, days: number) {
    this.contactRetentionDays = days;
  },
);

When(
  'the contact retention sweep runs on 23 March 2026',
  async function (this: BehaviorWorld) {
    const retention = new ContactDataRetentionService(this.repository, {
      dataRetentionEnabled: false,
      dataRetentionMs: this.contactRetentionDays * 24 * 60 * 60_000,
      retentionSweepIntervalMs: 60 * 60_000,
    } as ConfigType<typeof contactConfig>);

    await retention.purgeExpiredData(new Date('2026-03-23T00:00:00.000Z'));
    retention.onModuleDestroy();
  },
);

Then(
  'contact data older than 23 December 2025 should be removed',
  function (this: BehaviorWorld) {
    assert.equal(
      this.deletedContactDataBefore?.toISOString(),
      '2025-12-23T00:00:00.000Z',
    );
  },
);

When(
  'I submit a valid public contact message',
  async function (this: BehaviorWorld) {
    const httpServer = this.app!.getHttpServer() as Parameters<
      typeof request
    >[0];
    const response = await request(httpServer).post('/api/contact').send({
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
    const httpServer = this.app!.getHttpServer() as Parameters<
      typeof request
    >[0];
    const response = await request(httpServer).post('/api/contact').send({
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
  'no contact notification should run during the request',
  function (this: BehaviorWorld) {
    assert.equal(this.notificationCalls, 0);
  },
);

Then(
  'no contact persistence or notification should run',
  function (this: BehaviorWorld) {
    assert.equal(this.persistenceCalls, 0);
    assert.equal(this.notificationCalls, 0);
  },
);
