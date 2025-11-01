import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    // In test environments, allow skipping Prisma to speed up tests and avoid DB dependencies
    if (process.env.SKIP_PRISMA === 'true' || process.env.NODE_ENV === 'test') {
      return;
    }
    await this.$connect();
  }

  async onModuleDestroy() {
    // If skipping Prisma in tests, do not disconnect
    if (process.env.SKIP_PRISMA === 'true' || process.env.NODE_ENV === 'test') {
      return;
    }
    await this.$disconnect();
  }
}
