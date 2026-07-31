import { Test } from '@nestjs/testing';
import type { ConfigType } from '@nestjs/config';
import { contactConfig } from '../config';
import {
  CONTACT_MESSAGE_REPOSITORY,
  type ContactMessageRepositoryPort,
} from './application/ports/contact-message-repository.port';
import {
  type ContactNotificationDeliveryStatus,
  ContactNotificationError,
  CONTACT_NOTIFICATION_SENDER_PORT,
  CONTACT_NOTIFICATION_STATUS_PORT,
  type ContactNotificationSenderPort,
  type ContactNotificationStatusPort,
} from './application/ports/contact-notification.port';
import { ContactNotificationConfirmationService } from './contact-notification-confirmation.service';
import { ContactSubmission } from './domain/contact-submission';
import { ContactNotificationProcessor } from './contact-notification.processor';

describe('ContactNotificationProcessor', () => {
  let processor: ContactNotificationProcessor;
  let repositoryMock: jest.Mocked<ContactMessageRepositoryPort>;
  let notificationSenderMock: jest.Mocked<ContactNotificationSenderPort>;
  let notificationStatusMock: jest.Mocked<ContactNotificationStatusPort>;
  let confirmationServiceMock: jest.Mocked<ContactNotificationConfirmationService>;
  let contactConfiguration: ConfigType<typeof contactConfig>;

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(Date.parse('2026-03-23T10:00:00.000Z'));
    jest.clearAllMocks();

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

    notificationSenderMock = {
      send: jest.fn().mockResolvedValue({
        messageId: 'smtp-123',
        deliveryState: 'submitted',
      }),
    };
    notificationStatusMock = {
      lookup: jest.fn().mockResolvedValue({
        deliveryState: 'submitted',
      } satisfies ContactNotificationDeliveryStatus),
    };
    confirmationServiceMock = {
      recordDispatchOutcome: jest.fn().mockResolvedValue('submitted'),
      reconcileSubmittedNotification: jest
        .fn()
        .mockResolvedValue({ outcome: 'rescheduled' }),
      recordWebhookAndApply: jest.fn().mockResolvedValue({
        outcome: 'ignored',
      }),
    };

    contactConfiguration = {
      notificationProvider: 'resend',
      smtpHost: 'smtp.test.local',
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
      notificationBaseDelayMs: 1_000,
      notificationMaxDelayMs: 60_000,
      notificationSubmittedRecheckMs: 300_000,
      notificationSubmittedTimeoutMs: 3_600_000,
      dataRetentionEnabled: true,
      dataRetentionMs: 90 * 24 * 60 * 60_000,
      retentionSweepIntervalMs: 60 * 60_000,
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ContactNotificationProcessor,
        {
          provide: CONTACT_MESSAGE_REPOSITORY,
          useValue: repositoryMock,
        },
        {
          provide: CONTACT_NOTIFICATION_SENDER_PORT,
          useValue: notificationSenderMock,
        },
        {
          provide: CONTACT_NOTIFICATION_STATUS_PORT,
          useValue: notificationStatusMock,
        },
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

    processor = moduleRef.get(ContactNotificationProcessor);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('marks notifications as submitted when the provider requires webhook confirmation', async () => {
    repositoryMock.claimPendingNotifications.mockResolvedValue([
      {
        id: 'contact-1',
        submission: ContactSubmission.create({
          name: 'Jan',
          email: 'jan@example.com',
          message: 'To jest poprawna wiadomosc testowa.',
          requestId: 'req-1',
        }),
        attempt: 1,
      },
    ]);

    await expect(processor.processPendingNotifications()).resolves.toBe(1);

    expect(repositoryMock.claimPendingNotifications).toHaveBeenCalledWith({
      limit: 10,
      now: new Date('2026-03-23T10:00:00.000Z'),
      leaseMs: 30_000,
    });
    expect(notificationSenderMock.send).toHaveBeenCalledTimes(1);
    expect(notificationSenderMock.send).toHaveBeenCalledWith({
      submission: expect.objectContaining({
        name: 'Jan',
        email: 'jan@example.com',
        message: 'To jest poprawna wiadomosc testowa.',
        requestId: 'req-1',
      }),
      deliveryKey: 'contact-1',
    });
    expect(confirmationServiceMock.recordDispatchOutcome).toHaveBeenCalledWith({
      id: 'contact-1',
      messageId: 'smtp-123',
      deliveryState: 'submitted',
      observedAt: new Date('2026-03-23T10:00:00.000Z'),
    });
    expect(
      confirmationServiceMock.reconcileSubmittedNotification,
    ).not.toHaveBeenCalled();
  });

  it('marks notifications as delivered immediately for best-effort transports', async () => {
    repositoryMock.claimPendingNotifications.mockResolvedValue([
      {
        id: 'contact-smtp',
        submission: ContactSubmission.create({
          name: 'Jan',
          email: 'jan@example.com',
          message: 'To jest poprawna wiadomosc testowa.',
        }),
        attempt: 1,
      },
    ]);
    notificationSenderMock.send.mockResolvedValue({
      messageId: 'smtp-message-123',
      deliveryState: 'delivered',
    });
    confirmationServiceMock.recordDispatchOutcome.mockResolvedValueOnce(
      'delivered',
    );

    await expect(processor.processPendingNotifications()).resolves.toBe(1);

    expect(confirmationServiceMock.recordDispatchOutcome).toHaveBeenCalledWith({
      id: 'contact-smtp',
      messageId: 'smtp-message-123',
      deliveryState: 'delivered',
      observedAt: new Date('2026-03-23T10:00:00.000Z'),
    });
  });

  it('schedules exponential retry when delivery fails before the attempt limit', async () => {
    repositoryMock.claimPendingNotifications.mockResolvedValue([
      {
        id: 'contact-2',
        submission: ContactSubmission.create({
          name: 'Jan',
          email: 'jan@example.com',
          message: 'To jest poprawna wiadomosc testowa.',
        }),
        attempt: 2,
      },
    ]);
    notificationSenderMock.send.mockRejectedValue(
      new ContactNotificationError('Temporary SMTP error', true),
    );

    await expect(processor.processPendingNotifications()).resolves.toBe(1);

    expect(notificationSenderMock.send).toHaveBeenCalledWith({
      submission: expect.objectContaining({
        name: 'Jan',
        email: 'jan@example.com',
        message: 'To jest poprawna wiadomosc testowa.',
      }),
      deliveryKey: 'contact-2',
    });
    expect(repositoryMock.markNotificationFailed).toHaveBeenCalledWith({
      id: 'contact-2',
      error: 'Temporary SMTP error',
      nextAttemptAt: new Date('2026-03-23T10:00:02.000Z'),
    });
  });

  it('marks notifications as permanently failed after the final attempt', async () => {
    repositoryMock.claimPendingNotifications.mockResolvedValue([
      {
        id: 'contact-3',
        submission: ContactSubmission.create({
          name: 'Jan',
          email: 'jan@example.com',
          message: 'To jest poprawna wiadomosc testowa.',
        }),
        attempt: 5,
      },
    ]);
    notificationSenderMock.send.mockRejectedValue(
      new ContactNotificationError('Permanent SMTP error', false),
    );

    await expect(processor.processPendingNotifications()).resolves.toBe(1);

    expect(notificationSenderMock.send).toHaveBeenCalledWith({
      submission: expect.objectContaining({
        name: 'Jan',
        email: 'jan@example.com',
        message: 'To jest poprawna wiadomosc testowa.',
      }),
      deliveryKey: 'contact-3',
    });
    expect(repositoryMock.markNotificationFailed).toHaveBeenCalledWith({
      id: 'contact-3',
      error: 'Permanent SMTP error',
      nextAttemptAt: undefined,
    });
  });

  it('reconciles submitted notifications that are later confirmed as delivered', async () => {
    repositoryMock.claimSubmittedNotifications.mockResolvedValue([
      {
        id: 'contact-4',
        messageId: 're_email_123',
        submittedAt: new Date('2026-03-23T09:00:00.000Z'),
      },
    ]);
    notificationStatusMock.lookup.mockResolvedValueOnce({
      deliveryState: 'delivered',
    });
    confirmationServiceMock.reconcileSubmittedNotification.mockResolvedValueOnce(
      {
        outcome: 'delivered',
      },
    );

    await expect(processor.processPendingNotifications()).resolves.toBe(1);

    expect(notificationStatusMock.lookup).toHaveBeenCalledWith('re_email_123');
    expect(
      confirmationServiceMock.reconcileSubmittedNotification,
    ).toHaveBeenCalledWith({
      notification: {
        id: 'contact-4',
        messageId: 're_email_123',
        submittedAt: new Date('2026-03-23T09:00:00.000Z'),
      },
      observedAt: new Date('2026-03-23T10:00:00.000Z'),
      status: {
        deliveryState: 'delivered',
      },
    });
  });

  it('reschedules submitted notifications that still await confirmation', async () => {
    repositoryMock.claimSubmittedNotifications.mockResolvedValue([
      {
        id: 'contact-5',
        messageId: 're_email_456',
        submittedAt: new Date('2026-03-23T09:30:00.000Z'),
      },
    ]);
    notificationStatusMock.lookup.mockResolvedValueOnce({
      deliveryState: 'submitted',
    });
    confirmationServiceMock.reconcileSubmittedNotification.mockResolvedValueOnce(
      {
        outcome: 'rescheduled',
      },
    );

    await expect(processor.processPendingNotifications()).resolves.toBe(1);

    expect(
      confirmationServiceMock.reconcileSubmittedNotification,
    ).toHaveBeenCalledWith({
      notification: {
        id: 'contact-5',
        messageId: 're_email_456',
        submittedAt: new Date('2026-03-23T09:30:00.000Z'),
      },
      observedAt: new Date('2026-03-23T10:00:00.000Z'),
      status: {
        deliveryState: 'submitted',
      },
    });
  });

  it('reschedules submitted notifications when provider lookup fails', async () => {
    repositoryMock.claimSubmittedNotifications.mockResolvedValue([
      {
        id: 'contact-6',
        messageId: 're_email_789',
        submittedAt: new Date('2026-03-23T09:30:00.000Z'),
      },
    ]);
    notificationStatusMock.lookup.mockRejectedValueOnce(
      new ContactNotificationError('Lookup timeout', true),
    );
    confirmationServiceMock.reconcileSubmittedNotification.mockResolvedValueOnce(
      {
        outcome: 'rescheduled',
        reason: 'Confirmation lookup failed: Lookup timeout',
      },
    );

    await expect(processor.processPendingNotifications()).resolves.toBe(1);

    expect(
      confirmationServiceMock.reconcileSubmittedNotification,
    ).toHaveBeenCalledWith({
      notification: {
        id: 'contact-6',
        messageId: 're_email_789',
        submittedAt: new Date('2026-03-23T09:30:00.000Z'),
      },
      observedAt: new Date('2026-03-23T10:00:00.000Z'),
      lookupError: expect.objectContaining({
        message: 'Lookup timeout',
      }),
    });
  });

  it('marks submitted notifications as failed when provider confirmation times out', async () => {
    repositoryMock.claimSubmittedNotifications.mockResolvedValue([
      {
        id: 'contact-7',
        messageId: 're_email_timeout',
        submittedAt: new Date('2026-03-23T08:00:00.000Z'),
      },
    ]);
    notificationStatusMock.lookup.mockResolvedValueOnce({
      deliveryState: 'submitted',
    });
    confirmationServiceMock.reconcileSubmittedNotification.mockResolvedValueOnce(
      {
        outcome: 'timed_out',
        reason: 'Provider confirmation timed out',
      },
    );

    await expect(processor.processPendingNotifications()).resolves.toBe(1);

    expect(
      confirmationServiceMock.reconcileSubmittedNotification,
    ).toHaveBeenCalledWith({
      notification: {
        id: 'contact-7',
        messageId: 're_email_timeout',
        submittedAt: new Date('2026-03-23T08:00:00.000Z'),
      },
      observedAt: new Date('2026-03-23T10:00:00.000Z'),
      status: {
        deliveryState: 'submitted',
      },
    });
  });

  it('marks submitted notifications as failed when lookups keep failing past the timeout', async () => {
    repositoryMock.claimSubmittedNotifications.mockResolvedValue([
      {
        id: 'contact-8',
        messageId: 're_email_lookup_timeout',
        submittedAt: new Date('2026-03-23T08:00:00.000Z'),
      },
    ]);
    notificationStatusMock.lookup.mockRejectedValueOnce(
      new ContactNotificationError('Lookup timeout', true),
    );
    confirmationServiceMock.reconcileSubmittedNotification.mockResolvedValueOnce(
      {
        outcome: 'timed_out',
        reason:
          'Provider confirmation timed out after lookup errors: Lookup timeout',
      },
    );

    await expect(processor.processPendingNotifications()).resolves.toBe(1);

    expect(
      confirmationServiceMock.reconcileSubmittedNotification,
    ).toHaveBeenCalledWith({
      notification: {
        id: 'contact-8',
        messageId: 're_email_lookup_timeout',
        submittedAt: new Date('2026-03-23T08:00:00.000Z'),
      },
      observedAt: new Date('2026-03-23T10:00:00.000Z'),
      lookupError: expect.objectContaining({
        message: 'Lookup timeout',
      }),
    });
  });
});
