import { Test, TestingModule } from '@nestjs/testing';
import type { Request } from 'express';
import { ContactController } from './contact.controller';
import { ContactService, type CreateContactResult } from './contact.service';

describe('ContactController', () => {
  let controller: ContactController;
  const contactService = {
    createAndNotify: jest.fn<Promise<CreateContactResult>, []>(),
  };

  beforeEach(async () => {
    contactService.createAndNotify.mockReset();

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [ContactController],
      providers: [
        {
          provide: ContactService,
          useValue: contactService,
        },
      ],
    }).compile();

    controller = moduleRef.get(ContactController);
  });

  it('returns the strict service result and forwards request metadata', async () => {
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
      controller.send(
        {
          name: 'Jan',
          email: 'jan@example.com',
          message: 'To jest poprawna wiadomosc testowa.',
        },
        req,
      ),
    ).resolves.toEqual({
      ok: true,
      messageId: 'msg-123',
      savedId: 'saved-123',
    });

    expect(contactService.createAndNotify).toHaveBeenCalledWith({
      name: 'Jan',
      email: 'jan@example.com',
      message: 'To jest poprawna wiadomosc testowa.',
      ip: '198.51.100.23',
      requestId: 'req-123',
    });
  });

  it('returns ok=false when delivery fails after save', async () => {
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
      controller.send(
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
      savedId: 'saved-123',
    });
  });
});
