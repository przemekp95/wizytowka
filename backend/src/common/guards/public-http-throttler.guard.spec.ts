import type { ConfigType } from '@nestjs/config';
import { appConfig, throttleConfig } from '../../config';
import { ChatHttpThrottlerGuard, ContactHttpThrottlerGuard } from './public-http-throttler.guard';

describe('public HTTP throttling', () => {
  const appConfiguration = {
    internalProxySharedSecret: undefined,
  } as ConfigType<typeof appConfig>;
  const throttleConfiguration = {
    publicHttpLimit: 30,
    publicHttpTtlMs: 60_000,
    chatHttpLimit: 20,
    chatHttpTtlMs: 60_000,
    chatHttpGlobalLimit: 100,
    chatHttpGlobalTtlMs: 60_000,
  } as ConfigType<typeof throttleConfig>;

  function response() {
    return { setHeader: jest.fn() } as any;
  }

  it('uses the same semantic contact bucket as GraphQL', async () => {
    const storage = {
      increment: jest.fn().mockResolvedValue({ activeHits: [Date.now()], blocked: false }),
    } as any;
    const guard = new ContactHttpThrottlerGuard(
      storage,
      appConfiguration,
      throttleConfiguration,
    );

    await guard.canActivateHttp(
      { method: 'POST', ip: '198.51.100.31' } as any,
      response(),
    );

    expect(storage.increment).toHaveBeenCalledWith(
      'contact-public:198.51.100.31',
      60_000,
      30,
      expect.any(Number),
    );
  });

  it('enforces both per-client and global chat budgets', async () => {
    const storage = {
      increment: jest.fn().mockResolvedValue({ activeHits: [Date.now()], blocked: false }),
    } as any;
    const guard = new ChatHttpThrottlerGuard(
      storage,
      appConfiguration,
      throttleConfiguration,
    );

    await guard.canActivateHttp(
      { method: 'POST', ip: '198.51.100.32' } as any,
      response(),
    );

    expect(storage.increment).toHaveBeenCalledTimes(2);
    expect(storage.increment).toHaveBeenNthCalledWith(
      1,
      'chat-http:198.51.100.32',
      60_000,
      20,
      expect.any(Number),
    );
    expect(storage.increment).toHaveBeenNthCalledWith(
      2,
      'chat-http-global',
      60_000,
      100,
      expect.any(Number),
    );
  });
});
