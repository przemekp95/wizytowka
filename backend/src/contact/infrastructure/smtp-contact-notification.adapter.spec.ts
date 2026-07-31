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
      notificationProvider: 'smtp',
      smtpHost: 'smtp.test.local',
      smtpPort: 465,
      smtpSecure: true,
      smtpFrom: 'from@test.local',
      smtpTo: 'to@test.local',
      smtpUser: 'smtpuser@test.local',
      smtpPass: 'smtppass123',
      smtpDebug: false,
      resendApiKey: undefined,
      resendWebhookSecret: undefined,
      notificationDispatchEnabled: true,
      notificationDispatchIntervalMs: 1000,
      notificationDispatchBatchSize: 10,
      notificationLeaseMs: 30_000,
      notificationMaxAttempts: 5,
      notificationBaseDelayMs: 30_000,
      notificationMaxDelayMs: 900_000,
      notificationSubmittedRecheckMs: 300_000,
      notificationSubmittedTimeoutMs: 86_400_000,
      dataRetentionEnabled: true,
      dataRetentionMs: 90 * 24 * 60 * 60_000,
      retentionSweepIntervalMs: 60 * 60_000,
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
    const result = await adapter.send({
      submission: ContactSubmission.create({
        name: 'Jan',
        email: 'JAN@test.local',
        message: 'Treść wiadomości',
        ip: '203.0.113.7',
        requestId: 'req-123',
      }),
      deliveryKey: 'contact-1',
    });

    expect(result).toEqual({
      messageId: '<contact-contact-1@test.local>',
      deliveryState: 'delivered',
    });
    expect(sendMailMock).toHaveBeenCalledWith({
      from: 'from@test.local',
      to: 'to@test.local',
      replyTo: 'jan@test.local',
      subject: 'Wiadomość ze strony – Jan',
      text: expect.stringContaining('Imię i nazwisko: Jan'),
      messageId: '<contact-contact-1@test.local>',
      headers: {
        'X-Request-Id': 'req-123',
        'X-Contact-Delivery-Key': 'contact-1',
      },
    });
  });

  it('throws when SMTP configuration is incomplete', async () => {
    contactConfiguration.smtpHost = undefined;

    await expect(
      adapter.send({
        submission: ContactSubmission.create({
          name: 'Test',
          email: 'test@test.local',
          message: 'Test message',
        }),
        deliveryKey: 'contact-2',
      }),
    ).rejects.toThrow(/Brak konfiguracji SMTP/i);
  });

  it('bubbles SMTP transport errors so the outbox processor can retry', async () => {
    sendMailMock.mockRejectedValueOnce(new Error('Temporary SMTP error'));

    await expect(
      adapter.send({
        submission: ContactSubmission.create({
          name: 'Test',
          email: 'test@test.local',
          message: 'Test message',
          requestId: 'retry-test',
        }),
        deliveryKey: 'contact-3',
      }),
    ).rejects.toThrow('Temporary SMTP error');

    expect(sendMailMock).toHaveBeenCalledTimes(1);
  });
});
