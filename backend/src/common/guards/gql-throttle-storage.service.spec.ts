import type { ConfigType } from '@nestjs/config';
import { mongoConfig, throttleConfig } from '../../config';
import { GqlThrottleStorageService } from './gql-throttle-storage.service';

describe('GqlThrottleStorageService', () => {
  const mongoConfiguration: ConfigType<typeof mongoConfig> = {
    uri: undefined,
    dbName: 'wizytowka',
  };

  it('uses memory storage during tests by default', async () => {
    const storage = new GqlThrottleStorageService(
      {
        driver: 'memory',
        disabled: false,
        limit: 30,
        ttlMs: 60_000,
        publicHttpLimit: 30,
        publicHttpTtlMs: 60_000,
        chatHttpLimit: 20,
        chatHttpTtlMs: 60_000,
        chatHttpGlobalLimit: 100,
        chatHttpGlobalTtlMs: 60_000,
      } satisfies ConfigType<typeof throttleConfig>,
      mongoConfiguration,
    );

    for (let i = 0; i < 30; i++) {
      const result = await storage.increment('contact:test-ip', 60_000, 30, i);
      expect(result.blocked).toBe(false);
      expect(result.activeHits).toHaveLength(i + 1);
    }

    const blocked = await storage.increment('contact:test-ip', 60_000, 30, 31);

    expect(blocked.blocked).toBe(true);
    expect(blocked.activeHits).toHaveLength(30);
  });

  it('clears memory hits on reset', async () => {
    const storage = new GqlThrottleStorageService(
      {
        driver: 'memory',
        disabled: false,
        limit: 30,
        ttlMs: 60_000,
        publicHttpLimit: 30,
        publicHttpTtlMs: 60_000,
        chatHttpLimit: 20,
        chatHttpTtlMs: 60_000,
        chatHttpGlobalLimit: 100,
        chatHttpGlobalTtlMs: 60_000,
      } satisfies ConfigType<typeof throttleConfig>,
      mongoConfiguration,
    );
    await storage.increment('contact:test-ip', 60_000, 30, 1);
    storage.reset();

    const result = await storage.increment('contact:test-ip', 60_000, 30, 2);

    expect(result.blocked).toBe(false);
    expect(result.activeHits).toEqual([2]);
  });
});
