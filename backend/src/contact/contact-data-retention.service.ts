import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { contactConfig } from '../config';
import {
  CONTACT_MESSAGE_REPOSITORY,
  type ContactMessageRepositoryPort,
} from './application/ports/contact-message-repository.port';

@Injectable()
export class ContactDataRetentionService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(ContactDataRetentionService.name);
  private timer: NodeJS.Timeout | null = null;
  private destroyed = false;

  constructor(
    @Inject(CONTACT_MESSAGE_REPOSITORY)
    private readonly repository: ContactMessageRepositoryPort,
    @Inject(contactConfig.KEY)
    private readonly contactConfiguration: ConfigType<typeof contactConfig>,
  ) {}

  onModuleInit(): void {
    if (!this.contactConfiguration.dataRetentionEnabled) {
      return;
    }

    this.schedule(0);
  }

  onModuleDestroy(): void {
    this.destroyed = true;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  async purgeExpiredData(now = new Date()): Promise<void> {
    const before = new Date(
      now.getTime() - this.contactConfiguration.dataRetentionMs,
    );
    const removed = await this.repository.deleteExpired(before);

    if (removed.messages > 0 || removed.webhookEvents > 0) {
      this.logger.log(
        `Expired contact data removed. messages=${removed.messages} webhookEvents=${removed.webhookEvents} before=${before.toISOString()}`,
      );
    }
  }

  private schedule(delayMs: number): void {
    if (this.destroyed) {
      return;
    }

    this.timer = setTimeout(() => {
      void this.tick();
    }, delayMs);
    this.timer.unref?.();
  }

  private async tick(): Promise<void> {
    try {
      await this.purgeExpiredData();
    } catch (error) {
      this.logger.error(
        'Contact data retention sweep failed',
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      if (!this.destroyed) {
        this.schedule(this.contactConfiguration.retentionSweepIntervalMs);
      }
    }
  }
}
