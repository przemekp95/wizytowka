import {
  Controller,
  Get,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';

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
export class ContactAdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('messages')
  async list(
    @Req() req: Request,
    @Query('limit') limit = '20',
    @Query('cursor') cursor?: string,
  ) {
    const expected = `Bearer ${process.env.ADMIN_TOKEN ?? ''}`;
    if (!process.env.ADMIN_TOKEN || req.headers.authorization !== expected) {
      throw new UnauthorizedException();
    }

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
