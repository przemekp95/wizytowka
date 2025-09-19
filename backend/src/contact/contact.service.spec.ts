import { Test } from '@nestjs/testing';
import { ContactService } from './contact.service';
import { PrismaService } from '../prisma/prisma.service';
import nodemailer from 'nodemailer';

jest.mock('nodemailer', () => {
  const createTransport = jest.fn(); // implementacja będzie ustawiana w beforeEach
  return {
    __esModule: true,
    default: { createTransport },
    createTransport,
  };
});

describe('ContactService', () => {
  let service: ContactService;

  let sendMailMock: jest.Mock;
  let prismaMock: PrismaService;

  beforeEach(async () => {
    // ENV do maila
    process.env.SMTP_HOST = 'smtp.test.local';
    process.env.SMTP_FROM = 'from@test.local';
    process.env.SMTP_TO = 'to@test.local';
    process.env.SMTP_PORT = '465';
    process.env.SMTP_SECURE = 'true';

    // WAŻNE: najpierw wyczyść, potem przypnij implementacje mocków
    jest.clearAllMocks();

    // Mock transportera + sendMail
    sendMailMock = jest.fn().mockResolvedValue({
      messageId: 'test-id',
      accepted: ['to@example.com'],
      rejected: [],
    });
    const createTransport =
      (nodemailer as any).createTransport ??
      (nodemailer as any).default.createTransport;
    createTransport.mockReturnValue({ sendMail: sendMailMock });

    // Mock Prisma
    prismaMock = {
      contactMessage: {
        create: jest.fn().mockResolvedValue({ id: 'saved-123' }),
      },
    } as unknown as PrismaService;

    const moduleRef = await Test.createTestingModule({
      providers: [
        ContactService,
        { provide: PrismaService, useValue: prismaMock },
      ],
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

  it('sendMail: wysyła e-mail i zwraca messageId', async () => {
    const res = await service.sendMail({
      name: 'Jan',
      email: 'jan@test.local',
      message: 'Treść',
      ip: '203.0.113.7',
      requestId: 'req-123',
    });

    expect(res).toEqual({ messageId: 'test-id' });

    const createTransport =
      (nodemailer as any).createTransport ??
      (nodemailer as any).default?.createTransport;

    expect(createTransport).toHaveBeenCalled();
    expect(sendMailMock).toHaveBeenCalledWith(
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

  it('createAndNotify: zwraca savedId i messageId', async () => {
    const res = await service.createAndNotify({
      name: 'Ala',
      email: 'ala@test.local',
      message: 'Hej',
    });

    expect(res.ok).toBe(true);
    expect(res.savedId).toBe('saved-123');
    expect(res.messageId).toBe('test-id');

    expect(prismaMock.contactMessage.create as any).toHaveBeenCalledWith({
      data: {
        name: 'Ala',
        email: 'ala@test.local',
        message: 'Hej',
        ip: null,
      },
      select: { id: true },
    });
    expect(sendMailMock).toHaveBeenCalled();
  });

  it('sendMail: rzuca błąd przy braku wymaganej konfiguracji SMTP', async () => {
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
