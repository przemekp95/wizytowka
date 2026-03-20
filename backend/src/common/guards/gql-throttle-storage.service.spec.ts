import { GqlThrottleStorageService } from './gql-throttle-storage.service';

describe('GqlThrottleStorageService', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalThrottleStorage = process.env.THROTTLE_STORAGE;

  afterEach(async () => {
    process.env.NODE_ENV = originalNodeEnv;

    if (originalThrottleStorage === undefined) {
      delete process.env.THROTTLE_STORAGE;
    } else {
      process.env.THROTTLE_STORAGE = originalThrottleStorage;
    }
  });

  it('uses memory storage during tests by default', async () => {
    process.env.NODE_ENV = 'test';
    delete process.env.THROTTLE_STORAGE;

    const storage = new GqlThrottleStorageService();

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
    process.env.NODE_ENV = 'test';
    process.env.THROTTLE_STORAGE = 'memory';

    const storage = new GqlThrottleStorageService();
    await storage.increment('contact:test-ip', 60_000, 30, 1);
    storage.reset();

    const result = await storage.increment('contact:test-ip', 60_000, 30, 2);

    expect(result.blocked).toBe(false);
    expect(result.activeHits).toEqual([2]);
  });
});
