import { Test, TestingModule } from '@nestjs/testing';
import type { Request } from 'express';
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
      ip: '198.51.100.23',
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
