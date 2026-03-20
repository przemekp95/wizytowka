import { Test, TestingModule } from '@nestjs/testing';
import type { ConfigType } from '@nestjs/config';
import type { Request } from 'express';
import { GqlThrottleStorageService } from '../common/guards/gql-throttle-storage.service';
import { GqlThrottlerGuard } from '../common/guards/gql-throttler.guard';
import { mongoConfig, throttleConfig } from '../config';
import { ContactResolver } from './contact.resolver';
import { ContactService, type CreateContactResult } from './contact.service';

describe('ContactResolver', () => {
  let resolver: ContactResolver;
  const contactService = {
    createAndNotify: jest.fn<Promise<CreateContactResult>, []>(),
  };

  beforeEach(async () => {
    contactService.createAndNotify.mockReset();

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
          provide: ContactService,
          useValue: contactService,
        },
      ],
    }).compile();

    resolver = moduleRef.get(ContactResolver);
  });

  it('returns ok=true only when the service succeeds', async () => {
    contactService.createAndNotify.mockResolvedValue({
      ok: true,
      messageId: 'msg-123',
      savedId: 'saved-123',
    });

    const req = {
      headers: { 'x-forwarded-for': '198.51.100.23, 10.0.0.1' },
      ip: '10.0.0.1',
      requestId: 'req-123',
    } as Request;

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

    expect(contactService.createAndNotify).toHaveBeenCalledWith({
      name: 'Jan',
      email: 'jan@example.com',
      message: 'To jest poprawna wiadomosc testowa.',
      ip: '10.0.0.1',
      requestId: 'req-123',
    });
  });

  it('passes service failures through as ok=false', async () => {
    contactService.createAndNotify.mockResolvedValue({
      ok: false,
      error: 'Nie udalo sie dostarczyc wiadomosci. Sprobuj ponownie pozniej.',
      savedId: 'saved-123',
    });

    const req = {
      headers: {},
      ip: '127.0.0.1',
      requestId: 'req-456',
    } as Request;

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
      error: 'Nie udalo sie dostarczyc wiadomosci. Sprobuj ponownie pozniej.',
    });
  });
});
