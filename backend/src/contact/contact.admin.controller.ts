import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OpsTokenGuard } from '../common/guards/ops-token.guard';

// Define type for the select result
type ContactMessageItem = {
  id: string;
  name: string;
  email: string;
  message: string;
  ip: string | null;
  createdAt: Date;
};

@Controller('contact')
@UseGuards(OpsTokenGuard)
export class ContactAdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('messages')
  async list(@Query('limit') limit = '20', @Query('cursor') cursor?: string) {
    const take = Math.max(1, Math.min(Number(limit) || 20, 100));

    const items: ContactMessageItem[] =
      await this.prisma.contactMessage.findMany({
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

    const nextCursor =
      items.length === take ? items[items.length - 1].id : undefined;

    return { items, nextCursor };
  }
}
