import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { appConfig } from '../config';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private connected = false;
  private lastError: string | null = null;

  constructor(
    @Inject(appConfig.KEY)
    private readonly appConfiguration: ConfigType<typeof appConfig>,
  ) {
    super();
  }

  private shouldSkipConnection(): boolean {
    return this.appConfiguration.skipPrisma;
  }

  async onModuleInit() {
    if (this.shouldSkipConnection()) {
      this.connected = true;
      this.lastError = null;
      return;
    }

    await this.refreshHealth().catch(() => undefined);
  }

  async onModuleDestroy() {
    if (this.shouldSkipConnection()) {
      this.connected = false;
      return;
    }

    await this.$disconnect();
    this.connected = false;
    this.lastError = null;
  }

  async getDependencyStatus(): Promise<{
    name: 'prisma';
    ready: boolean;
    error?: string;
  }> {
    if (this.shouldSkipConnection()) {
      return {
        name: 'prisma',
        ready: true,
      };
    }

    await this.refreshHealth().catch(() => undefined);

    return {
      name: 'prisma',
      ready: this.connected,
      ...(this.lastError ? { error: this.lastError } : {}),
    };
  }

  private async refreshHealth(): Promise<void> {
    try {
      await this.$connect();
      await this.$runCommandRaw({ ping: 1 });
      this.connected = true;
      this.lastError = null;
    } catch (error) {
      this.connected = false;
      this.lastError = error instanceof Error ? error.message : String(error);
      this.logger.error(`Prisma connection failed: ${this.lastError}`);
    }
  }
}
