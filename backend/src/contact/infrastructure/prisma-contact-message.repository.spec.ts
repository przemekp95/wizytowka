import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ContactSubmission } from '../domain/contact-submission';
import { PrismaContactMessageRepository } from './prisma-contact-message.repository';

describe('PrismaContactMessageRepository', () => {
  let repository: PrismaContactMessageRepository;
  let prisma: {
    contactMessage: {
      create: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      updateMany: jest.Mock;
      update: jest.Mock;
      deleteMany: jest.Mock;
    };
    contactNotificationWebhookEvent: {
      create: jest.Mock;
      deleteMany: jest.Mock;
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();

    prisma = {
      contactMessage: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
      },
      contactNotificationWebhookEvent: {
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    repository = new PrismaContactMessageRepository(
      prisma as unknown as PrismaService,
    );
  });

  it('deletes contact payloads and webhook events older than the retention cutoff', async () => {
    const before = new Date('2026-01-01T00:00:00.000Z');
    prisma.contactMessage.deleteMany.mockResolvedValue({ count: 2 });
    prisma.contactNotificationWebhookEvent.deleteMany.mockResolvedValue({
      count: 3,
    });

    await expect(repository.deleteExpired(before)).resolves.toEqual({
      messages: 2,
      webhookEvents: 3,
    });

    expect(prisma.contactNotificationWebhookEvent.deleteMany).toHaveBeenCalledWith({
      where: { receivedAt: { lt: before } },
    });
    expect(prisma.contactMessage.deleteMany).toHaveBeenCalledWith({
      where: { createdAt: { lt: before } },
    });
  });

  it('persists new contact messages as pending notifications', async () => {
    prisma.contactMessage.create.mockResolvedValue({ id: 'saved-123' });

    await expect(
      repository.save(
        ContactSubmission.create({
          name: 'Jan',
          email: 'jan@example.com',
          message: 'To jest poprawna wiadomosc testowa.',
          ip: '203.0.113.7',
          requestId: 'req-123',
        }),
      ),
    ).resolves.toEqual({ id: 'saved-123' });

    expect(prisma.contactMessage.create).toHaveBeenCalledWith({
      data: {
        name: 'Jan',
        email: 'jan@example.com',
        message: 'To jest poprawna wiadomosc testowa.',
        ip: '203.0.113.7',
        requestId: 'req-123',
        notificationStatus: 'pending',
        notificationAttempts: 0,
        notificationNextAttemptAt: expect.any(Date),
      },
      select: { id: true },
    });
  });

  it('claims due notifications by leasing them and returning reconstructed submissions', async () => {
    const now = new Date('2026-03-23T10:00:00.000Z');

    prisma.contactMessage.findMany.mockResolvedValue([
      {
        id: 'contact-1',
        name: 'Jan',
        email: 'jan@example.com',
        message: 'To jest poprawna wiadomosc testowa.',
        ip: '203.0.113.7',
        requestId: 'req-123',
        notificationAttempts: 1,
      },
    ]);
    prisma.contactMessage.updateMany.mockResolvedValue({ count: 1 });

    await expect(
      repository.claimPendingNotifications({
        limit: 10,
        now,
        leaseMs: 30_000,
      }),
    ).resolves.toEqual([
      {
        id: 'contact-1',
        submission: expect.objectContaining({
          name: 'Jan',
          email: 'jan@example.com',
          message: 'To jest poprawna wiadomosc testowa.',
          ip: '203.0.113.7',
          requestId: 'req-123',
        }),
        attempt: 2,
      },
    ]);

    expect(prisma.contactMessage.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          {
            notificationStatus: 'pending',
            notificationNextAttemptAt: {
              lte: now,
            },
          },
          {
            notificationStatus: 'processing',
            notificationLeaseExpiresAt: {
              lte: now,
            },
          },
        ],
      },
      orderBy: { createdAt: 'asc' },
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        message: true,
        ip: true,
        requestId: true,
        notificationAttempts: true,
      },
    });
    expect(prisma.contactMessage.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'contact-1',
        OR: [
          {
            notificationStatus: 'pending',
            notificationNextAttemptAt: {
              lte: now,
            },
          },
          {
            notificationStatus: 'processing',
            notificationLeaseExpiresAt: {
              lte: now,
            },
          },
        ],
      },
      data: {
        notificationStatus: 'processing',
        notificationLeaseExpiresAt: new Date('2026-03-23T10:00:30.000Z'),
        notificationAttempts: {
          increment: 1,
        },
      },
    });
  });

  it('marks notifications as submitted to a provider awaiting webhook confirmation', async () => {
    const submittedAt = new Date('2026-03-23T10:02:00.000Z');
    const nextCheckAt = new Date('2026-03-23T10:07:00.000Z');

    await repository.markNotificationSubmitted({
      id: 'contact-1',
      messageId: 're_123',
      submittedAt,
      nextCheckAt,
    });

    expect(prisma.contactMessage.update).toHaveBeenCalledWith({
      where: { id: 'contact-1' },
      data: {
        notificationStatus: 'submitted',
        notificationLeaseExpiresAt: null,
        notificationNextAttemptAt: nextCheckAt,
        notificationLastError: null,
        notificationSubmittedAt: submittedAt,
        notificationMessageId: 're_123',
      },
    });
  });

  it('claims submitted notifications that are due for reconciliation', async () => {
    const now = new Date('2026-03-23T10:10:00.000Z');

    prisma.contactMessage.findMany.mockResolvedValue([
      {
        id: 'contact-2',
        notificationMessageId: 're_456',
        notificationSubmittedAt: new Date('2026-03-23T10:02:00.000Z'),
      },
    ]);
    prisma.contactMessage.updateMany.mockResolvedValue({ count: 1 });

    await expect(
      repository.claimSubmittedNotifications({
        limit: 5,
        now,
        leaseMs: 30_000,
      }),
    ).resolves.toEqual([
      {
        id: 'contact-2',
        messageId: 're_456',
        submittedAt: new Date('2026-03-23T10:02:00.000Z'),
      },
    ]);

    expect(prisma.contactMessage.findMany).toHaveBeenCalledWith({
      where: {
        notificationStatus: 'submitted',
        notificationMessageId: {
          not: null,
        },
        OR: [
          {
            notificationNextAttemptAt: {
              lte: now,
            },
          },
          {
            notificationNextAttemptAt: null,
          },
        ],
        AND: [
          {
            OR: [
              {
                notificationLeaseExpiresAt: null,
              },
              {
                notificationLeaseExpiresAt: {
                  lte: now,
                },
              },
            ],
          },
        ],
      },
      orderBy: [{ notificationNextAttemptAt: 'asc' }, { createdAt: 'asc' }],
      take: 5,
      select: {
        id: true,
        notificationMessageId: true,
        notificationSubmittedAt: true,
      },
    });
    expect(prisma.contactMessage.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'contact-2',
        notificationStatus: 'submitted',
        notificationMessageId: 're_456',
        OR: [
          {
            notificationLeaseExpiresAt: null,
          },
          {
            notificationLeaseExpiresAt: {
              lte: now,
            },
          },
        ],
      },
      data: {
        notificationLeaseExpiresAt: new Date('2026-03-23T10:10:30.000Z'),
      },
    });
  });

  it('marks notifications as delivered', async () => {
    const deliveredAt = new Date('2026-03-23T10:05:00.000Z');

    await repository.markNotificationDelivered({
      id: 'contact-1',
      messageId: 'smtp-123',
      deliveredAt,
    });

    expect(prisma.contactMessage.update).toHaveBeenCalledWith({
      where: { id: 'contact-1' },
      data: {
        notificationStatus: 'delivered',
        notificationLeaseExpiresAt: null,
        notificationNextAttemptAt: null,
        notificationLastError: null,
        notificationSentAt: deliveredAt,
        notificationMessageId: 'smtp-123',
      },
    });
  });

  it('finds the local notification id by provider message id', async () => {
    prisma.contactMessage.findFirst.mockResolvedValue({ id: 'contact-1' });

    await expect(
      repository.findNotificationIdByMessageId('re_123'),
    ).resolves.toBe('contact-1');

    expect(prisma.contactMessage.findFirst).toHaveBeenCalledWith({
      where: { notificationMessageId: 're_123' },
      select: { id: true },
    });
  });

  it('marks notifications for retry or permanent failure', async () => {
    const nextAttemptAt = new Date('2026-03-23T10:10:00.000Z');

    await repository.markNotificationFailed({
      id: 'contact-1',
      error: 'Temporary SMTP error',
      nextAttemptAt,
    });
    await repository.markNotificationFailed({
      id: 'contact-2',
      error: 'Permanent SMTP error',
      messageId: 're_456',
    });

    expect(prisma.contactMessage.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'contact-1' },
      data: {
        notificationStatus: 'pending',
        notificationLeaseExpiresAt: null,
        notificationLastError: 'Temporary SMTP error',
        notificationNextAttemptAt: nextAttemptAt,
      },
    });
    expect(prisma.contactMessage.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'contact-2' },
      data: {
        notificationStatus: 'failed',
        notificationLeaseExpiresAt: null,
        notificationLastError: 'Permanent SMTP error',
        notificationNextAttemptAt: null,
        notificationMessageId: 're_456',
      },
    });
  });

  it('reschedules submitted notification reconciliation checks', async () => {
    const nextAttemptAt = new Date('2026-03-23T10:15:00.000Z');

    await repository.rescheduleSubmittedNotificationCheck({
      id: 'contact-3',
      nextAttemptAt,
      error: 'Confirmation lookup failed: timeout',
    });

    expect(prisma.contactMessage.update).toHaveBeenCalledWith({
      where: { id: 'contact-3' },
      data: {
        notificationStatus: 'submitted',
        notificationLeaseExpiresAt: null,
        notificationNextAttemptAt: nextAttemptAt,
        notificationLastError: 'Confirmation lookup failed: timeout',
      },
    });
  });

  it('records webhook events and ignores duplicate deliveries', async () => {
    prisma.contactNotificationWebhookEvent.create.mockResolvedValue({
      id: 'msg_123',
    });

    await expect(
      repository.recordWebhookEvent({
        webhookId: 'msg_123',
        provider: 'resend',
        eventType: 'email.delivered',
        contactMessageId: 'contact-1',
        messageId: 're_123',
        eventCreatedAt: new Date('2026-03-23T10:06:00.000Z'),
      }),
    ).resolves.toBe('recorded');

    prisma.contactNotificationWebhookEvent.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: '5.22.0',
      }),
    );

    await expect(
      repository.recordWebhookEvent({
        webhookId: 'msg_123',
        provider: 'resend',
        eventType: 'email.delivered',
        contactMessageId: 'contact-1',
        messageId: 're_123',
        eventCreatedAt: new Date('2026-03-23T10:06:00.000Z'),
      }),
    ).resolves.toBe('duplicate');
  });
});
