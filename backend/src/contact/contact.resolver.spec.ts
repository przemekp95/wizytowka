import { Test, TestingModule } from '@nestjs/testing';
import { createHmac } from 'node:crypto';
import type { ConfigType } from '@nestjs/config';
import type { Request } from 'express';
import { GqlThrottleStorageService } from '../common/guards/gql-throttle-storage.service';
import { GqlThrottlerGuard } from '../common/guards/gql-throttler.guard';
import { appConfig, mongoConfig, throttleConfig } from '../config';
import { ContactResolver } from './contact.resolver';
import { ContactService, type CreateContactResult } from './contact.service';

describe('ContactResolver', () => {
  let resolver: ContactResolver;
  let appConfiguration: ConfigType<typeof appConfig>;
  const contactService = {
    createAndQueueNotification: jest.fn<Promise<CreateContactResult>, []>(),
  };

  beforeEach(async () => {
    contactService.createAndQueueNotification.mockReset();
    appConfiguration = {
      nodeEnv: 'test',
      port: 4000,
      frontendUrl: undefined,
      corsOrigins: [],
      trustProxy: false,
      skipPrisma: true,
      graphqlPlayground: true,
      graphqlIntrospection: true,
      apiDocsEnabled: true,
      graphqlSchemaDocsEnabled: true,
      internalProxySharedSecret: undefined,
    } satisfies ConfigType<typeof appConfig>;

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ContactResolver,
        GqlThrottlerGuard,
        GqlThrottleStorageService,
        {
          provide: throttleConfig.KEY,
          useValue: {
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
        },
        {
          provide: mongoConfig.KEY,
          useValue: {
            uri: undefined,
            dbName: 'wizytowka',
          } satisfies ConfigType<typeof mongoConfig>,
        },
        {
          provide: appConfig.KEY,
          useValue: appConfiguration,
        },
        {
          provide: ContactService,
          useValue: contactService,
        },
      ],
    }).compile();

    resolver = moduleRef.get(ContactResolver);
  });

  it('returns ok=true only when the service succeeds', async () => {
    contactService.createAndQueueNotification.mockResolvedValue({
      ok: true,
      savedId: 'saved-123',
    });

    const req = {
      headers: { 'x-forwarded-for': '198.51.100.23, 10.0.0.1' },
      ip: '10.0.0.1',
      requestId: 'req-123',
    } as unknown as Request;

    await expect(
      resolver.sendContact(
        {
          name: 'Jan',
          email: 'jan@example.com',
          message: 'To jest poprawna wiadomosc testowa.',
        },
        req,
      ),
    ).resolves.toEqual({ ok: true, error: undefined });

    expect(contactService.createAndQueueNotification).toHaveBeenCalledWith({
      name: 'Jan',
      email: 'jan@example.com',
      message: 'To jest poprawna wiadomosc testowa.',
      ip: '10.0.0.1',
      requestId: 'req-123',
    });
  });

  it('passes service failures through as ok=false', async () => {
    contactService.createAndQueueNotification.mockResolvedValue({
      ok: false,
      failureCode: 'contact_persistence_failed',
    });

    const req = {
      headers: {},
      ip: '127.0.0.1',
      requestId: 'req-456',
    } as unknown as Request;

    await expect(
      resolver.sendContact(
        {
          name: 'Jan',
          email: 'jan@example.com',
          message: 'To jest poprawna wiadomosc testowa.',
        },
        req,
      ),
    ).resolves.toEqual({
      ok: false,
      error: 'Nie udalo sie zapisac wiadomosci. Sprobuj ponownie pozniej.',
    });
  });

  it('uses the signed forwarded client IP when the shared secret is configured', async () => {
    const timestamp = Date.now().toString();

    appConfiguration.internalProxySharedSecret = 'proxy-secret';
    contactService.createAndQueueNotification.mockResolvedValue({
      ok: true,
      savedId: 'saved-123',
    });

    const req = {
      ip: '10.0.0.1',
      requestId: 'req-789',
      header(name: string) {
        const headers: Record<string, string> = {
          'X-Forwarded-Client-Ip': '203.0.113.25',
          'X-Forwarded-Client-Timestamp': timestamp,
          'X-Forwarded-Client-Signature': createHmac('sha256', 'proxy-secret')
            .update(`203.0.113.25:${timestamp}`)
            .digest('hex'),
        };

        return headers[name];
      },
    } as unknown as Request;

    await resolver.sendContact(
      {
        name: 'Jan',
        email: 'jan@example.com',
        message: 'To jest poprawna wiadomosc testowa.',
      },
      req,
    );

    expect(contactService.createAndQueueNotification).toHaveBeenCalledWith({
      name: 'Jan',
      email: 'jan@example.com',
      message: 'To jest poprawna wiadomosc testowa.',
      ip: '203.0.113.25',
      requestId: 'req-789',
    });
  });
});
