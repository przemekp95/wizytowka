import { Test } from '@nestjs/testing';
import { ContactService } from './contact.service';
import { PrismaService } from '../prisma/prisma.service';
import nodemailer from 'nodemailer';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

describe('ContactService', () => {
  let service: ContactService;
  let sendMailMock: jest.Mock;
  let prismaMock: PrismaService;

  beforeEach(async () => {
    // Setup environment variables
    process.env.SMTP_HOST = 'smtp.test.local';
    process.env.SMTP_FROM = 'from@test.local';
    process.env.SMTP_TO = 'to@test.local';
    process.env.SMTP_PORT = '465';
    process.env.SMTP_SECURE = 'true';
    process.env.SMTP_USER = 'smtpuser@test.local';
    process.env.SMTP_PASS = 'smtppass123';

    jest.clearAllMocks();

    // Setup mocks
    sendMailMock = jest.fn().mockResolvedValue({
      messageId: 'test-id',
      accepted: ['to@example.com'],
      rejected: [],
    });

    const createTransportMock = jest.fn().mockReturnValue({
      sendMail: sendMailMock,
    });

    // Properly mock the createTransport function
    (nodemailer.createTransport as jest.Mock) = createTransportMock;

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
    // Cleanup environment variables
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_FROM;
    delete process.env.SMTP_TO;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_SECURE;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.SMTP_DEBUG;
    jest.clearAllMocks();
  });

  it('should send email and return messageId', async () => {
    const result = await service.sendMail({
      name: 'Jan',
      email: 'jan@test.local',
      message: 'Treść wiadomości',
      ip: '203.0.113.7',
      requestId: 'req-123',
    });

    expect(result).toEqual({ messageId: 'test-id' });
    expect(sendMailMock).toHaveBeenCalledWith({
      from: 'from@test.local',
      to: 'to@test.local',
      replyTo: 'jan@test.local',
      subject: 'Wiadomość ze strony – Jan',
      text: expect.stringContaining('Imię i nazwisko: Jan'),
      headers: { 'X-Request-Id': 'req-123' },
    });
  });

  it('should save to database and send email successfully', async () => {
    const result = await service.createAndNotify({
      name: 'Ala',
      email: 'ala@test.local',
      message: 'Hej',
      ip: '127.0.0.1',
      requestId: 'db-email-test',
    });

    expect(result).toEqual({
      ok: true,
      messageId: 'test-id',
      savedId: 'saved-123',
    });

    expect(prismaMock.contactMessage.create).toHaveBeenCalledWith({
      data: {
        name: 'Ala',
        email: 'ala@test.local',
        message: 'Hej',
        ip: '127.0.0.1',
      },
      select: { id: true },
    });
  });

  it('should stop when database save fails', async () => {
    const dbError = new Error('Database connection failed');
    (prismaMock.contactMessage.create as jest.Mock).mockRejectedValue(dbError);

    const result = await service.createAndNotify({
      name: 'Test',
      email: 'test@test.local',
      message: 'Test message',
    });

    expect(result).toEqual({
      ok: false,
      error: 'Nie udalo sie zapisac wiadomosci. Sprobuj ponownie pozniej.',
    });

    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it('should handle email failure gracefully and keep savedId for recovery', async () => {
    const emailError = new Error('SMTP failure');
    sendMailMock.mockRejectedValue(emailError);

    const result = await service.createAndNotify({
      name: 'Test',
      email: 'test@test.local',
      message: 'Test message',
    });

    expect(result).toEqual({
      ok: false,
      error: 'Nie udalo sie dostarczyc wiadomosci. Sprobuj ponownie pozniej.',
      savedId: 'saved-123',
    });

    expect(prismaMock.contactMessage.create).toHaveBeenCalled();
  });

  it('should throw error when SMTP configuration is incomplete', async () => {
    delete process.env.SMTP_HOST;

    await expect(
      service.sendMail({
        name: 'Test',
        email: 'test@test.local',
        message: 'Test message',
      }),
    ).rejects.toThrow(/Brak konfiguracji SMTP/i);
  });

  it('should test retry functionality with single failure', async () => {
    // Mock the private retryWithBackoff method by making sendMail fail once then succeed
    const error = new Error('Temporary SMTP error');
    sendMailMock
      .mockRejectedValueOnce(error) // First call fails
      .mockResolvedValueOnce({     // Second call succeeds
        messageId: 'retried-success-id',
        accepted: ['to@example.com'],
        rejected: [],
      });

    const result = await service.sendMail({
      name: 'Test',
      email: 'test@test.local',
      message: 'Test message',
      requestId: 'retry-test',
    });

    expect(result).toEqual({ messageId: 'retried-success-id' });
    expect(sendMailMock).toHaveBeenCalledTimes(2); // One initial + one retry
  });
});
