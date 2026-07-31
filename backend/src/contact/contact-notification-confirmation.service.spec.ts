import { Test } from '@nestjs/testing';
import type { ConfigType } from '@nestjs/config';
import { contactConfig } from '../config';
import {
  CONTACT_MESSAGE_REPOSITORY,
  type ContactMessageRepositoryPort,
} from './application/ports/contact-message-repository.port';
import { ContactNotificationConfirmationService } from './contact-notification-confirmation.service';

describe('ContactNotificationConfirmationService', () => {
  let service: ContactNotificationConfirmationService;
  let repositoryMock: jest.Mocked<ContactMessageRepositoryPort>;
  let contactConfiguration: ConfigType<typeof contactConfig>;

  beforeEach(async () => {
    repositoryMock = {
      save: jest.fn().mockResolvedValue({ id: 'saved-123' }),
      deleteExpired: jest.fn().mockResolvedValue({ messages: 0, webhookEvents: 0 }),
      claimPendingNotifications: jest.fn().mockResolvedValue([]),
      claimSubmittedNotifications: jest.fn().mockResolvedValue([]),
      markNotificationSubmitted: jest.fn().mockResolvedValue(undefined),
      markNotificationDelivered: jest.fn().mockResolvedValue(undefined),
      rescheduleSubmittedNotificationCheck: jest
        .fn()
        .mockResolvedValue(undefined),
      findNotificationIdByMessageId: jest.fn().mockResolvedValue(null),
      markNotificationFailed: jest.fn().mockResolvedValue(undefined),
      recordWebhookEvent: jest.fn().mockResolvedValue('recorded'),
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
      resendWebhookSecret: 'whsec_test_123',
      notificationDispatchEnabled: true,
      notificationDispatchIntervalMs: 1000,
      notificationDispatchBatchSize: 10,
      notificationLeaseMs: 30_000,
      notificationMaxAttempts: 5,
      notificationBaseDelayMs: 1000,
      notificationMaxDelayMs: 60_000,
      notificationSubmittedRecheckMs: 300_000,
      notificationSubmittedTimeoutMs: 3_600_000,
      dataRetentionEnabled: true,
      dataRetentionMs: 90 * 24 * 60 * 60_000,
      retentionSweepIntervalMs: 60 * 60_000,
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ContactNotificationConfirmationService,
        {
          provide: CONTACT_MESSAGE_REPOSITORY,
          useValue: repositoryMock,
        },
        {
          provide: contactConfig.KEY,
          useValue: contactConfiguration,
        },
      ],
    }).compile();

    service = moduleRef.get(ContactNotificationConfirmationService);
  });

  it('records submitted dispatches and schedules the first confirmation recheck', async () => {
    await expect(
      service.recordDispatchOutcome({
        id: 'contact-1',
        messageId: 're_123',
        deliveryState: 'submitted',
        observedAt: new Date('2026-03-23T10:00:00.000Z'),
      }),
    ).resolves.toBe('submitted');

    expect(repositoryMock.markNotificationSubmitted).toHaveBeenCalledWith({
      id: 'contact-1',
      messageId: 're_123',
      submittedAt: new Date('2026-03-23T10:00:00.000Z'),
      nextCheckAt: new Date('2026-03-23T10:05:00.000Z'),
    });
  });

  it('records immediate deliveries for best-effort transports', async () => {
    await expect(
      service.recordDispatchOutcome({
        id: 'contact-1',
        messageId: 'smtp_123',
        deliveryState: 'delivered',
        observedAt: new Date('2026-03-23T10:01:00.000Z'),
      }),
    ).resolves.toBe('delivered');

    expect(repositoryMock.markNotificationDelivered).toHaveBeenCalledWith({
      id: 'contact-1',
      messageId: 'smtp_123',
      deliveredAt: new Date('2026-03-23T10:01:00.000Z'),
    });
  });

  it('marks submitted notifications as delivered when the provider confirms delivery', async () => {
    await expect(
      service.reconcileSubmittedNotification({
        notification: {
          id: 'contact-2',
          messageId: 're_456',
          submittedAt: new Date('2026-03-23T09:00:00.000Z'),
        },
        observedAt: new Date('2026-03-23T10:00:00.000Z'),
        status: {
          deliveryState: 'delivered',
        },
      }),
    ).resolves.toEqual({
      outcome: 'delivered',
    });

    expect(repositoryMock.markNotificationDelivered).toHaveBeenCalledWith({
      id: 'contact-2',
      messageId: 're_456',
      deliveredAt: new Date('2026-03-23T10:00:00.000Z'),
    });
  });

  it('reschedules submitted notifications that still await confirmation', async () => {
    await expect(
      service.reconcileSubmittedNotification({
        notification: {
          id: 'contact-3',
          messageId: 're_789',
          submittedAt: new Date('2026-03-23T09:30:00.000Z'),
        },
        observedAt: new Date('2026-03-23T10:00:00.000Z'),
        status: {
          deliveryState: 'submitted',
        },
      }),
    ).resolves.toEqual({
      outcome: 'rescheduled',
    });

    expect(
      repositoryMock.rescheduleSubmittedNotificationCheck,
    ).toHaveBeenCalledWith({
      id: 'contact-3',
      nextAttemptAt: new Date('2026-03-23T10:05:00.000Z'),
    });
  });

  it('marks submitted notifications as timed out after the confirmation window', async () => {
    await expect(
      service.reconcileSubmittedNotification({
        notification: {
          id: 'contact-4',
          messageId: 're_timeout',
          submittedAt: new Date('2026-03-23T08:00:00.000Z'),
        },
        observedAt: new Date('2026-03-23T10:00:00.000Z'),
        status: {
          deliveryState: 'submitted',
        },
      }),
    ).resolves.toEqual({
      outcome: 'timed_out',
      reason: 'Provider confirmation timed out',
    });

    expect(repositoryMock.markNotificationFailed).toHaveBeenCalledWith({
      id: 'contact-4',
      error: 'Provider confirmation timed out',
      messageId: 're_timeout',
    });
  });

  it('reschedules lookup failures before the confirmation window expires', async () => {
    await expect(
      service.reconcileSubmittedNotification({
        notification: {
          id: 'contact-5',
          messageId: 're_lookup',
          submittedAt: new Date('2026-03-23T09:30:00.000Z'),
        },
        observedAt: new Date('2026-03-23T10:00:00.000Z'),
        lookupError: new Error('Lookup timeout'),
      }),
    ).resolves.toEqual({
      outcome: 'rescheduled',
      reason: 'Confirmation lookup failed: Lookup timeout',
    });

    expect(
      repositoryMock.rescheduleSubmittedNotificationCheck,
    ).toHaveBeenCalledWith({
      id: 'contact-5',
      nextAttemptAt: new Date('2026-03-23T10:05:00.000Z'),
      error: 'Confirmation lookup failed: Lookup timeout',
    });
  });

  it('times out lookup failures after the confirmation window expires', async () => {
    await expect(
      service.reconcileSubmittedNotification({
        notification: {
          id: 'contact-6',
          messageId: 're_lookup_timeout',
          submittedAt: new Date('2026-03-23T08:00:00.000Z'),
        },
        observedAt: new Date('2026-03-23T10:00:00.000Z'),
        lookupError: new Error('Lookup timeout'),
      }),
    ).resolves.toEqual({
      outcome: 'timed_out',
      reason:
        'Provider confirmation timed out after lookup errors: Lookup timeout',
    });

    expect(repositoryMock.markNotificationFailed).toHaveBeenCalledWith({
      id: 'contact-6',
      error:
        'Provider confirmation timed out after lookup errors: Lookup timeout',
      messageId: 're_lookup_timeout',
    });
  });

  it('records webhook events, resolves notification ids, and applies failure states', async () => {
    repositoryMock.findNotificationIdByMessageId.mockResolvedValueOnce(
      'contact-7',
    );

    await expect(
      service.recordWebhookAndApply({
        webhookId: 'msg_123',
        provider: 'resend',
        eventType: 'email.suppressed',
        messageId: 're_999',
        eventCreatedAt: new Date('2026-03-23T10:06:00.000Z'),
        failureReason: 'Mailbox is suppressed',
      }),
    ).resolves.toEqual({
      outcome: 'failed',
    });

    expect(repositoryMock.recordWebhookEvent).toHaveBeenCalledWith({
      webhookId: 'msg_123',
      provider: 'resend',
      eventType: 'email.suppressed',
      contactMessageId: undefined,
      messageId: 're_999',
      eventCreatedAt: new Date('2026-03-23T10:06:00.000Z'),
    });
    expect(repositoryMock.findNotificationIdByMessageId).toHaveBeenCalledWith(
      're_999',
    );
    expect(repositoryMock.markNotificationFailed).toHaveBeenCalledWith({
      id: 'contact-7',
      error: 'Mailbox is suppressed',
      messageId: 're_999',
    });
  });

  it('ignores duplicate webhook deliveries', async () => {
    repositoryMock.recordWebhookEvent.mockResolvedValueOnce('duplicate');

    await expect(
      service.recordWebhookAndApply({
        webhookId: 'msg_123',
        provider: 'resend',
        eventType: 'email.delivered',
        contactMessageId: 'contact-8',
        messageId: 're_dup',
        eventCreatedAt: new Date('2026-03-23T10:06:00.000Z'),
      }),
    ).resolves.toEqual({
      outcome: 'duplicate',
    });

    expect(repositoryMock.markNotificationDelivered).not.toHaveBeenCalled();
    expect(repositoryMock.markNotificationFailed).not.toHaveBeenCalled();
  });
});
