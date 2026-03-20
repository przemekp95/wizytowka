import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type ContactMessageListItem = {
  id: string;
  name: string;
  email: string;
  message: string;
  ip: string | null;
  createdAt: Date;
};

export type ListContactMessagesInput = {
  limit: number;
  cursor?: string;
};

export type ListContactMessagesResult = {
  items: ContactMessageListItem[];
  nextCursor?: string;
};

@Injectable()
export class ContactAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listMessages({
    limit,
    cursor,
  }: ListContactMessagesInput): Promise<ListContactMessagesResult> {
    const take = Math.max(1, Math.min(limit || 20, 100));
    const items = await this.prisma.contactMessage.findMany({
      take,
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
        items.length === take ? items[items.length - 1].id : undefined,
    };
  }
}
