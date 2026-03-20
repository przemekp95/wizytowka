import { Test } from '@nestjs/testing';
import type { ConfigType } from '@nestjs/config';
import nodemailer from 'nodemailer';
import { contactConfig } from '../../config';
import { ContactSubmission } from '../domain/contact-submission';
import { SmtpContactNotificationAdapter } from './smtp-contact-notification.adapter';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

describe('SmtpContactNotificationAdapter', () => {
  let adapter: SmtpContactNotificationAdapter;
  let sendMailMock: jest.Mock;
  let contactConfiguration: ConfigType<typeof contactConfig>;

  beforeEach(async () => {
    jest.clearAllMocks();

    contactConfiguration = {
      smtpHost: 'smtp.test.local',
      smtpPort: 465,
      smtpSecure: true,
      smtpFrom: 'from@test.local',
      smtpTo: 'to@test.local',
      smtpUser: 'smtpuser@test.local',
      smtpPass: 'smtppass123',
      smtpDebug: false,
    };

    sendMailMock = jest.fn().mockResolvedValue({
      messageId: 'test-id',
      accepted: ['to@example.com'],
      rejected: [],
    });

    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: sendMailMock,
    });

    const moduleRef = await Test.createTestingModule({
      providers: [
        SmtpContactNotificationAdapter,
        { provide: contactConfig.KEY, useValue: contactConfiguration },
      ],
    }).compile();

    adapter = moduleRef.get(SmtpContactNotificationAdapter);
  });

  it('sends SMTP notification and returns message id', async () => {
    const result = await adapter.send(
      ContactSubmission.create({
        name: 'Jan',
        email: 'JAN@test.local',
        message: 'Treść wiadomości',
        ip: '203.0.113.7',
        requestId: 'req-123',
      }),
    );

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

  it('throws when SMTP configuration is incomplete', async () => {
    contactConfiguration.smtpHost = undefined;

    await expect(
      adapter.send(
        ContactSubmission.create({
          name: 'Test',
          email: 'test@test.local',
          message: 'Test message',
        }),
      ),
    ).rejects.toThrow(/Brak konfiguracji SMTP/i);
  });

  it('retries once before succeeding on temporary failure', async () => {
    sendMailMock
      .mockRejectedValueOnce(new Error('Temporary SMTP error'))
      .mockResolvedValueOnce({
        messageId: 'retried-success-id',
        accepted: ['to@example.com'],
        rejected: [],
      });

    const result = await adapter.send(
      ContactSubmission.create({
        name: 'Test',
        email: 'test@test.local',
        message: 'Test message',
        requestId: 'retry-test',
      }),
    );

    expect(result).toEqual({ messageId: 'retried-success-id' });
    expect(sendMailMock).toHaveBeenCalledTimes(2);
  });
});
