import type { ConfigType } from '@nestjs/config';
import { contactConfig } from '../config';
import type { ContactMessageRepositoryPort } from './application/ports/contact-message-repository.port';
import { ContactDataRetentionService } from './contact-data-retention.service';

describe('ContactDataRetentionService', () => {
  const retentionMs = 90 * 24 * 60 * 60 * 1000;
  let repository: jest.Mocked<ContactMessageRepositoryPort>;
  let service: ContactDataRetentionService;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(Date.parse('2026-03-23T10:00:00.000Z'));
    repository = {
      deleteExpired: jest.fn().mockResolvedValue({
        messages: 2,
        webhookEvents: 1,
      }),
    } as unknown as jest.Mocked<ContactMessageRepositoryPort>;
    service = new ContactDataRetentionService(
      repository,
      {
        notificationProvider: 'smtp',
        smtpHost: undefined,
        smtpPort: 465,
        smtpSecure: true,
        smtpFrom: undefined,
        smtpTo: undefined,
        smtpUser: undefined,
        smtpPass: undefined,
        smtpDebug: false,
        resendApiKey: undefined,
        resendWebhookSecret: undefined,
        notificationDispatchEnabled: true,
        notificationDispatchIntervalMs: 1_000,
        notificationDispatchBatchSize: 10,
        notificationLeaseMs: 30_000,
        notificationMaxAttempts: 5,
        notificationBaseDelayMs: 30_000,
        notificationMaxDelayMs: 900_000,
        notificationSubmittedRecheckMs: 300_000,
        notificationSubmittedTimeoutMs: 86_400_000,
        dataRetentionEnabled: true,
        dataRetentionMs: retentionMs,
        retentionSweepIntervalMs: 3_600_000,
      } satisfies ConfigType<typeof contactConfig>,
    );
  });

  afterEach(() => {
    service.onModuleDestroy();
    jest.useRealTimers();
  });

  it('purges expired contact and webhook records on startup and on the configured interval', async () => {
    service.onModuleInit();

    await jest.advanceTimersByTimeAsync(0);

    expect(repository.deleteExpired).toHaveBeenNthCalledWith(
      1,
      new Date('2025-12-23T10:00:00.000Z'),
    );

    await jest.advanceTimersByTimeAsync(3_600_000);

    expect(repository.deleteExpired).toHaveBeenNthCalledWith(
      2,
      new Date('2025-12-23T11:00:00.000Z'),
    );
  });

  it('does not schedule retention sweeps when they are disabled for the runtime', async () => {
    service.onModuleDestroy();
    service = new ContactDataRetentionService(repository, {
      dataRetentionEnabled: false,
      dataRetentionMs: retentionMs,
      retentionSweepIntervalMs: 3_600_000,
    } as ConfigType<typeof contactConfig>);

    service.onModuleInit();
    await jest.advanceTimersByTimeAsync(3_600_000);

    expect(repository.deleteExpired).not.toHaveBeenCalled();
  });
});
