import { Test } from '@nestjs/testing';
import type { ConfigType } from '@nestjs/config';
import { contactConfig } from '../../config';
import {
  ContactNotificationError,
  type ContactNotificationRequest,
} from '../application/ports/contact-notification.port';
import { ContactSubmission } from '../domain/contact-submission';
import { ResendContactNotificationAdapter } from './resend-contact-notification.adapter';

describe('ResendContactNotificationAdapter', () => {
  let adapter: ResendContactNotificationAdapter;
  let contactConfiguration: ConfigType<typeof contactConfig>;
  let fetchMock: jest.MockedFunction<typeof fetch>;
  const originalFetch = global.fetch;

  beforeEach(async () => {
    jest.clearAllMocks();

    contactConfiguration = {
      notificationProvider: 'resend',
      smtpHost: undefined,
      smtpPort: 465,
      smtpSecure: true,
      smtpFrom: 'from@test.local',
      smtpTo: 'to@test.local',
      smtpUser: undefined,
      smtpPass: undefined,
      smtpDebug: false,
      resendApiKey: 're_test_123',
      resendWebhookSecret: 'whsec_test_123',
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

    fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 're_email_123' }),
    } as Response);
    global.fetch = fetchMock;

    const moduleRef = await Test.createTestingModule({
      providers: [
        ResendContactNotificationAdapter,
        { provide: contactConfig.KEY, useValue: contactConfiguration },
      ],
    }).compile();

    adapter = moduleRef.get(ResendContactNotificationAdapter);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('submits a contact email through Resend with idempotency key and tracking tags', async () => {
    const request: ContactNotificationRequest = {
      submission: ContactSubmission.create({
        name: 'Jan',
        email: 'jan@example.com',
        message: 'To jest poprawna wiadomosc testowa.',
        ip: '203.0.113.7',
        requestId: 'req-123',
      }),
      deliveryKey: 'contact-1',
    };

    await expect(adapter.send(request)).resolves.toEqual({
      messageId: 're_email_123',
      deliveryState: 'submitted',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(init).toEqual(
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer re_test_123',
          'Content-Type': 'application/json',
          'Idempotency-Key': 'contact-message/contact-1',
        },
      }),
    );
    expect(JSON.parse(String(init?.body))).toEqual({
      from: 'from@test.local',
      to: ['to@test.local'],
      reply_to: 'jan@example.com',
      subject: 'Wiadomość ze strony – Jan',
      text: expect.stringContaining('Imię i nazwisko: Jan'),
      headers: {
        'X-Request-Id': 'req-123',
        'X-Contact-Delivery-Key': 'contact-1',
      },
      tags: [
        {
          name: 'contact_message_id',
          value: 'contact-1',
        },
        {
          name: 'contact_request_id',
          value: 'req-123',
        },
      ],
    });
  });

  it('fails fast when Resend configuration is incomplete', async () => {
    contactConfiguration.resendApiKey = undefined;

    await expect(
      adapter.send({
        submission: ContactSubmission.create({
          name: 'Jan',
          email: 'jan@example.com',
          message: 'To jest poprawna wiadomosc testowa.',
        }),
        deliveryKey: 'contact-1',
      }),
    ).rejects.toEqual(
      expect.objectContaining<ContactNotificationError>({
        message: 'Brak konfiguracji Resend API key',
        retryable: false,
      }),
    );
  });

  it('marks provider rate limits as retryable', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({
        name: 'rate_limit_exceeded',
        message: 'Too many requests',
      }),
    } as Response);

    await expect(
      adapter.send({
        submission: ContactSubmission.create({
          name: 'Jan',
          email: 'jan@example.com',
          message: 'To jest poprawna wiadomosc testowa.',
        }),
        deliveryKey: 'contact-1',
      }),
    ).rejects.toEqual(
      expect.objectContaining<ContactNotificationError>({
        message: 'Too many requests',
        retryable: true,
      }),
    );
  });

  it('maps delivered provider state during reconciliation lookup', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 're_email_123',
        last_event: 'delivered',
      }),
    } as Response);

    await expect(adapter.lookup('re_email_123')).resolves.toEqual({
      deliveryState: 'delivered',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.resend.com/emails/re_email_123',
      {
        method: 'GET',
        headers: {
          Authorization: 'Bearer re_test_123',
        },
      },
    );
  });

  it('maps failed provider state during reconciliation lookup', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 're_email_123',
        last_event: 'bounced',
      }),
    } as Response);

    await expect(adapter.lookup('re_email_123')).resolves.toEqual({
      deliveryState: 'failed',
      failureReason: 'Provider status: bounced',
    });
  });
});
