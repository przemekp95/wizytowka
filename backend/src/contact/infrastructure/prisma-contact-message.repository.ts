import { Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ContactSubmission } from '../domain/contact-submission';
import type {
  ClaimedContactNotification,
  ClaimedSubmittedContactNotification,
  ContactMessageRepositoryPort,
  PersistedContactMessage,
} from '../application/ports/contact-message-repository.port';
import type {
  ContactMessageReadPort,
  ListContactMessagesResult,
} from '../application/ports/contact-message-read.port';

@Injectable()
export class PrismaContactMessageRepository
  implements ContactMessageRepositoryPort, ContactMessageReadPort
{
  constructor(private readonly prisma: PrismaService) {}

  async save(submission: ContactSubmission): Promise<PersistedContactMessage> {
    const saved = await this.prisma.contactMessage.create({
      data: {
        name: submission.name,
        email: submission.email,
        message: submission.message,
        ip: submission.ip ?? null,
        requestId: submission.requestId ?? null,
        notificationStatus: 'pending',
        notificationAttempts: 0,
        notificationNextAttemptAt: new Date(),
      },
      select: { id: true },
    });

    return { id: saved.id };
  }

  async deleteExpired(before: Date): Promise<{
    messages: number;
    webhookEvents: number;
  }> {
    const webhookEvents =
      await this.prisma.contactNotificationWebhookEvent.deleteMany({
        where: { receivedAt: { lt: before } },
      });
    const messages = await this.prisma.contactMessage.deleteMany({
      where: { createdAt: { lt: before } },
    });

    return {
      messages: messages.count,
      webhookEvents: webhookEvents.count,
    };
  }

  async claimPendingNotifications({
    limit,
    now,
    leaseMs,
  }: {
    limit: number;
    now: Date;
    leaseMs: number;
  }): Promise<ClaimedContactNotification[]> {
    const candidates = await this.prisma.contactMessage.findMany({
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
      take: limit,
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
    const leaseUntil = new Date(now.getTime() + leaseMs);
    const claimed: ClaimedContactNotification[] = [];

    for (const candidate of candidates) {
      const updated = await this.prisma.contactMessage.updateMany({
        where: {
          id: candidate.id,
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
          notificationLeaseExpiresAt: leaseUntil,
          notificationAttempts: {
            increment: 1,
          },
        },
      });

      if (updated.count !== 1) {
        continue;
      }

      claimed.push({
        id: candidate.id,
        submission: ContactSubmission.create({
          name: candidate.name,
          email: candidate.email,
          message: candidate.message,
          ...(candidate.ip ? { ip: candidate.ip } : {}),
          ...(candidate.requestId ? { requestId: candidate.requestId } : {}),
        }),
        attempt: candidate.notificationAttempts + 1,
      });
    }

    return claimed;
  }

  async markNotificationSubmitted({
    id,
    messageId,
    submittedAt,
    nextCheckAt,
  }: {
    id: string;
    messageId: string;
    submittedAt: Date;
    nextCheckAt: Date;
  }): Promise<void> {
    await this.prisma.contactMessage.update({
      where: { id },
      data: {
        notificationStatus: 'submitted',
        notificationLeaseExpiresAt: null,
        notificationNextAttemptAt: nextCheckAt,
        notificationLastError: null,
        notificationSubmittedAt: submittedAt,
        notificationMessageId: messageId,
      },
    });
  }

  async claimSubmittedNotifications({
    limit,
    now,
    leaseMs,
  }: {
    limit: number;
    now: Date;
    leaseMs: number;
  }): Promise<ClaimedSubmittedContactNotification[]> {
    const candidates = await this.prisma.contactMessage.findMany({
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
      take: limit,
      select: {
        id: true,
        notificationMessageId: true,
        notificationSubmittedAt: true,
      },
    });
    const leaseUntil = new Date(now.getTime() + leaseMs);
    const claimed: ClaimedSubmittedContactNotification[] = [];

    for (const candidate of candidates) {
      if (!candidate.notificationMessageId) {
        continue;
      }

      const updated = await this.prisma.contactMessage.updateMany({
        where: {
          id: candidate.id,
          notificationStatus: 'submitted',
          notificationMessageId: candidate.notificationMessageId,
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
          notificationLeaseExpiresAt: leaseUntil,
        },
      });

      if (updated.count !== 1) {
        continue;
      }

      claimed.push({
        id: candidate.id,
        messageId: candidate.notificationMessageId,
        submittedAt: candidate.notificationSubmittedAt ?? now,
      });
    }

    return claimed;
  }

  async markNotificationDelivered({
    id,
    messageId,
    deliveredAt,
  }: {
    id: string;
    messageId: string;
    deliveredAt: Date;
  }): Promise<void> {
    await this.prisma.contactMessage.update({
      where: { id },
      data: {
        notificationStatus: 'delivered',
        notificationLeaseExpiresAt: null,
        notificationNextAttemptAt: null,
        notificationLastError: null,
        notificationSentAt: deliveredAt,
        notificationMessageId: messageId,
      },
    });
  }

  async rescheduleSubmittedNotificationCheck({
    id,
    nextAttemptAt,
    error,
  }: {
    id: string;
    nextAttemptAt: Date;
    error?: string;
  }): Promise<void> {
    await this.prisma.contactMessage.update({
      where: { id },
      data: {
        notificationStatus: 'submitted',
        notificationLeaseExpiresAt: null,
        notificationNextAttemptAt: nextAttemptAt,
        notificationLastError: error ?? null,
      },
    });
  }

  async findNotificationIdByMessageId(
    messageId: string,
  ): Promise<string | null> {
    const contactMessage = await this.prisma.contactMessage.findFirst({
      where: { notificationMessageId: messageId },
      select: { id: true },
    });

    return contactMessage?.id ?? null;
  }

  async markNotificationFailed({
    id,
    error,
    nextAttemptAt,
    messageId,
  }: {
    id: string;
    error: string;
    nextAttemptAt?: Date;
    messageId?: string;
  }): Promise<void> {
    await this.prisma.contactMessage.update({
      where: { id },
      data: {
        notificationStatus: nextAttemptAt ? 'pending' : 'failed',
        notificationLeaseExpiresAt: null,
        notificationLastError: error,
        notificationNextAttemptAt: nextAttemptAt ?? null,
        ...(messageId ? { notificationMessageId: messageId } : {}),
      },
    });
  }

  async recordWebhookEvent({
    webhookId,
    provider,
    eventType,
    contactMessageId,
    messageId,
    eventCreatedAt,
  }: {
    webhookId: string;
    provider: string;
    eventType: string;
    contactMessageId?: string;
    messageId?: string;
    eventCreatedAt: Date;
  }): Promise<'recorded' | 'duplicate'> {
    try {
      await this.prisma.contactNotificationWebhookEvent.create({
        data: {
          id: webhookId,
          provider,
          eventType,
          contactMessageId: contactMessageId ?? null,
          notificationMessageId: messageId ?? null,
          eventCreatedAt,
        },
      });

      return 'recorded';
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return 'duplicate';
      }

      throw error;
    }
  }

  async listMessages({
    limit,
    cursor,
  }: {
    limit: number;
    cursor?: string;
  }): Promise<ListContactMessagesResult> {
    const items = await this.prisma.contactMessage.findMany({
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        message: true,
        ip: true,
        createdAt: true,
      },
    });

    return {
      items,
      nextCursor:
        items.length === limit ? items[items.length - 1]?.id : undefined,
    };
  }
}
