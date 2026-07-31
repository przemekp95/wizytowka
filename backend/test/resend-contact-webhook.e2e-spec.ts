import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.bootstrap';
import { ResendContactWebhookService } from '../src/contact/infrastructure/resend-contact-webhook.service';

describe('Resend contact webhook (e2e)', () => {
  let app: INestApplication;
  const webhookService = {
    handleWebhook: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ResendContactWebhookService)
      .useValue(webhookService)
      .compile();

    app = moduleRef.createNestApplication({ rawBody: true });
    configureApp(app, { enableSwagger: false });
    await app.init();
  });

  beforeEach(() => {
    webhookService.handleWebhook.mockReset();
    webhookService.handleWebhook.mockResolvedValue(undefined);
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/contact/webhooks/resend forwards the raw payload and signature headers', async () => {
    const payload = JSON.stringify({
      type: 'email.delivered',
      created_at: '2026-03-23T10:06:00.000Z',
      data: {
        email_id: 're_email_123',
        tags: {
          contact_message_id: 'contact-1',
        },
      },
    });

    const response = await request(app.getHttpServer())
      .post('/api/contact/webhooks/resend')
      .set('content-type', 'application/json')
      .set('svix-id', 'msg_123')
      .set('svix-timestamp', '1760000000')
      .set('svix-signature', 'v1,signature')
      .send(payload)
      .expect(200);

    expect(response.body).toEqual({ received: true });
    expect(webhookService.handleWebhook).toHaveBeenCalledWith({
      payload,
      headers: {
        id: 'msg_123',
        timestamp: '1760000000',
        signature: 'v1,signature',
      },
    });
  });
});
