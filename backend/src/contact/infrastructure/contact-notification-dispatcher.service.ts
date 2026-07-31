import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { contactConfig } from '../../config';
import type { ContactNotificationDispatchPort } from '../application/ports/contact-notification-dispatch.port';
import { ContactNotificationProcessor } from '../contact-notification.processor';

@Injectable()
export class ContactNotificationDispatcher
  implements OnModuleInit, OnModuleDestroy, ContactNotificationDispatchPort
{
  private readonly logger = new Logger(ContactNotificationDispatcher.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private destroyed = false;
  private immediateRunRequested = false;

  constructor(
    private readonly processor: ContactNotificationProcessor,
    @Inject(contactConfig.KEY)
    private readonly contactConfiguration: ConfigType<typeof contactConfig>,
  ) {}

  onModuleInit(): void {
    if (!this.contactConfiguration.notificationDispatchEnabled) {
      return;
    }

    this.scheduleNext(0);
  }

  onModuleDestroy(): void {
    this.destroyed = true;

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  kick(): void {
    if (
      !this.contactConfiguration.notificationDispatchEnabled ||
      this.destroyed
    ) {
      return;
    }

    if (this.running) {
      this.immediateRunRequested = true;
      return;
    }

    this.scheduleNext(0);
  }

  private scheduleNext(delayMs: number): void {
    if (this.destroyed) {
      return;
    }

    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(() => {
      void this.tick();
    }, delayMs);
    this.timer.unref?.();
  }

  private async tick(): Promise<void> {
    if (this.running || this.destroyed) {
      return;
    }

    this.running = true;
    let processed = 0;

    try {
      processed = await this.processor.processPendingNotifications();
    } catch (error) {
      this.logger.error(
        'Queued contact notification dispatch failed',
        error instanceof Error ? error.stack : String(error),
      );
    }

    this.running = false;

    if (
      this.destroyed ||
      !this.contactConfiguration.notificationDispatchEnabled
    ) {
      return;
    }

    const nextDelay =
      this.immediateRunRequested ||
      processed >= this.contactConfiguration.notificationDispatchBatchSize
        ? 0
        : this.contactConfiguration.notificationDispatchIntervalMs;
    this.immediateRunRequested = false;
    this.scheduleNext(nextDelay);
  }
}
