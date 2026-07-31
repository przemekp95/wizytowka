import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { ConfigType } from '@nestjs/config';
import { Webhook } from 'svix';
import { contactConfig } from '../../config';
import { ContactNotificationConfirmationService } from '../contact-notification-confirmation.service';
import { ResendContactWebhookService } from './resend-contact-webhook.service';

describe('ResendContactWebhookService', () => {
  let service: ResendContactWebhookService;
  let confirmationServiceMock: jest.Mocked<ContactNotificationConfirmationService>;
  let contactConfiguration: ConfigType<typeof contactConfig>;

  beforeEach(async () => {
    jest.clearAllMocks();

    confirmationServiceMock = {
      recordDispatchOutcome: jest.fn().mockResolvedValue('submitted'),
      reconcileSubmittedNotification: jest
        .fn()
        .mockResolvedValue({ outcome: 'rescheduled' }),
      recordWebhookAndApply: jest.fn().mockResolvedValue({
        outcome: 'delivered',
      }),
    };

    contactConfiguration = {
      notificationProvider: 'resend',
      smtpHost: undefined,
      smtpPort: 465,
      smtpSecure: true,
      smtpFrom: 'from@test.local',
      smtpTo: 'to@test.local',
      smtpUser: undefined,
      smtpPass: undefined,
      smtpDebug: false,
      resendApiKey: 're_test_123',
      resendWebhookSecret: 'whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw',
      notificationDispatchEnabled: true,
      notificationDispatchIntervalMs: 1000,
      notificationDispatchBatchSize: 10,
      notificationLeaseMs: 30_000,
      notificationMaxAttempts: 5,
      notificationBaseDelayMs: 30_000,
      notificationMaxDelayMs: 900_000,
      notificationSubmittedRecheckMs: 300_000,
      notificationSubmittedTimeoutMs: 86_400_000,
      dataRetentionEnabled: true,
      dataRetentionMs: 90 * 24 * 60 * 60_000,
      retentionSweepIntervalMs: 60 * 60_000,
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ResendContactWebhookService,
        {
          provide: ContactNotificationConfirmationService,
          useValue: confirmationServiceMock,
        },
        {
          provide: contactConfig.KEY,
          useValue: contactConfiguration,
        },
      ],
    }).compile();

    service = moduleRef.get(ResendContactWebhookService);
  });

  it('verifies a delivered webhook and marks the notification as delivered', async () => {
    const payload = JSON.stringify({
      type: 'email.delivered',
      created_at: '2026-03-23T10:06:00.000Z',
      data: {
        email_id: 're_email_123',
        tags: {
          contact_message_id: 'contact-1',
        },
      },
    });
    const webhook = new Webhook(contactConfiguration.resendWebhookSecret!);
    const timestamp = new Date();
    const headers = {
      id: 'msg_123',
      timestamp: Math.floor(timestamp.getTime() / 1000).toString(),
      signature: webhook.sign('msg_123', timestamp, payload),
    };

    await expect(
      service.handleWebhook({
        payload,
        headers,
      }),
    ).resolves.toBeUndefined();

    expect(confirmationServiceMock.recordWebhookAndApply).toHaveBeenCalledWith({
      webhookId: 'msg_123',
      provider: 'resend',
      eventType: 'email.delivered',
      contactMessageId: 'contact-1',
      messageId: 're_email_123',
      eventCreatedAt: new Date('2026-03-23T10:06:00.000Z'),
      failureReason: 'email.delivered',
    });
  });

  it('ignores duplicate webhook deliveries', async () => {
    const payload = JSON.stringify({
      type: 'email.delivered',
      created_at: '2026-03-23T10:06:00.000Z',
      data: {
        email_id: 're_email_123',
        tags: {
          contact_message_id: 'contact-1',
        },
      },
    });
    const webhook = new Webhook(contactConfiguration.resendWebhookSecret!);
    const timestamp = new Date();
    confirmationServiceMock.recordWebhookAndApply.mockResolvedValueOnce({
      outcome: 'duplicate',
    });

    await expect(
      service.handleWebhook({
        payload,
        headers: {
          id: 'msg_123',
          timestamp: Math.floor(timestamp.getTime() / 1000).toString(),
          signature: webhook.sign('msg_123', timestamp, payload),
        },
      }),
    ).resolves.toBeUndefined();

    expect(confirmationServiceMock.recordWebhookAndApply).toHaveBeenCalled();
  });

  it('falls back to provider message id when the webhook has no local tag', async () => {
    const payload = JSON.stringify({
      type: 'email.suppressed',
      created_at: '2026-03-23T10:07:00.000Z',
      data: {
        email_id: 're_email_456',
        suppressed: {
          message: 'Mailbox is suppressed',
        },
      },
    });
    const webhook = new Webhook(contactConfiguration.resendWebhookSecret!);
    const timestamp = new Date();
    confirmationServiceMock.recordWebhookAndApply.mockResolvedValueOnce({
      outcome: 'failed',
    });

    await expect(
      service.handleWebhook({
        payload,
        headers: {
          id: 'msg_456',
          timestamp: Math.floor(timestamp.getTime() / 1000).toString(),
          signature: webhook.sign('msg_456', timestamp, payload),
        },
      }),
    ).resolves.toBeUndefined();

    expect(confirmationServiceMock.recordWebhookAndApply).toHaveBeenCalledWith({
      webhookId: 'msg_456',
      provider: 'resend',
      eventType: 'email.suppressed',
      contactMessageId: null,
      messageId: 're_email_456',
      eventCreatedAt: new Date('2026-03-23T10:07:00.000Z'),
      failureReason: 'Mailbox is suppressed',
    });
  });

  it('rejects invalid signatures', async () => {
    await expect(
      service.handleWebhook({
        payload:
          '{"type":"email.delivered","created_at":"2026-03-23T10:06:00.000Z","data":{"email_id":"re_email_123"}}',
        headers: {
          id: 'msg_123',
          timestamp: Math.floor(Date.now() / 1000).toString(),
          signature: 'v1,invalid',
        },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
