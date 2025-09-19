import { Test } from '@nestjs/testing';
import { ContactService } from './contact.service';
import nodemailer from 'nodemailer';

jest.mock('nodemailer', () => {
  const sendMail = jest.fn().mockResolvedValue({
    messageId: 'test-id',
    accepted: ['to@example.com'],
    rejected: [],
  });
  const createTransport = jest.fn(() => ({ sendMail }));

  // ważne: eksportujemy zarówno top-level `createTransport`, jak i `default`
  return {
    __esModule: true,
    default: { createTransport },
    createTransport,
  };
});

describe('ContactService', () => {
  let service: ContactService;

  beforeEach(async () => {
    process.env.SMTP_HOST = 'smtp.test.local';
    process.env.SMTP_FROM = 'from@test.local';
    process.env.SMTP_TO = 'to@test.local';
    process.env.SMTP_PORT = '465';
    process.env.SMTP_SECURE = 'true';

    const moduleRef = await Test.createTestingModule({
      providers: [ContactService],
    }).compile();

    service = moduleRef.get(ContactService);
  });

  afterEach(() => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_FROM;
    delete process.env.SMTP_TO;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_SECURE;
    jest.resetAllMocks();
  });

  it('wysyła e-mail przez transporter i zwraca messageId', async () => {
    const res = await service.sendMail({
      name: 'Jan',
      email: 'jan@test.local',
      message: 'Treść',
      ip: '203.0.113.7',
      requestId: 'req-123',
    });

    expect(res).toEqual({ messageId: 'test-id' });

    // UWAGA: bez `.default` — tak działa import w tym środowisku
    const mockedCreate =
      (nodemailer as any).createTransport ??
      (nodemailer as any).default?.createTransport;

    expect(mockedCreate).toHaveBeenCalled();

    const transporter = mockedCreate.mock.results[0].value as {
      sendMail: jest.Mock;
    };

    expect(transporter.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'from@test.local',
        to: 'to@test.local',
        replyTo: 'jan@test.local',
        subject: expect.stringContaining('Jan'),
        text: expect.stringContaining('Treść'),
        headers: { 'X-Request-Id': 'req-123' },
      }),
    );
  });

  it('rzuca błąd przy braku wymaganej konfiguracji SMTP', async () => {
    delete process.env.SMTP_HOST;

    await expect(
      service.sendMail({
        name: 'Ktoś',
        email: 'kto@test.local',
        message: 'x',
      }),
    ).rejects.toThrow(/Brak konfiguracji SMTP/i);
  });
});
