import { INestApplication } from '@nestjs/common';
import { createHmac } from 'node:crypto';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.bootstrap';
import { ContactHttpThrottlerGuard } from '../src/common/guards/public-http-throttler.guard';
import { ContactService } from '../src/contact/contact.service';

describe('Contact HTTP (e2e)', () => {
  let app: INestApplication;
  const originalSharedSecret = process.env.INTERNAL_PROXY_SHARED_SECRET;
  const contactService = {
    createAndQueueNotification: jest.fn(),
  };

  beforeAll(async () => {
    process.env.INTERNAL_PROXY_SHARED_SECRET = 'proxy-secret';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ContactService)
      .useValue(contactService)
      .compile();

    app = moduleRef.createNestApplication();
    configureApp(app, { enableSwagger: false });
    await app.init();
  });

  beforeEach(() => {
    (app.get(ContactHttpThrottlerGuard) as any).storage.reset();
    contactService.createAndQueueNotification.mockReset();
    contactService.createAndQueueNotification.mockResolvedValue({
      ok: true,
      savedId: 'saved-123',
    });
  });

  afterAll(async () => {
    if (originalSharedSecret === undefined) {
      delete process.env.INTERNAL_PROXY_SHARED_SECRET;
    } else {
      process.env.INTERNAL_PROXY_SHARED_SECRET = originalSharedSecret;
    }

    await app.close();
  });

  it('POST /api/contact -> 429 after the shared public HTTP limit is exceeded', async () => {
    const payload = {
      name: 'Jan Testowy',
      email: 'jan@example.com',
      message: 'To jest poprawna wiadomosc testowa.',
    };

    for (let index = 0; index < 30; index += 1) {
      await request(app.getHttpServer())
        .post('/api/contact')
        .send(payload)
        .expect(200);
    }

    const response = await request(app.getHttpServer())
      .post('/api/contact')
      .send(payload)
      .expect(429);

    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'Too Many Requests',
        code: 'TOO_MANY_REQUESTS',
      }),
    );
    expect(contactService.createAndQueueNotification).toHaveBeenCalledTimes(30);
  });

  it('POST /api/contact uses the signed forwarded client IP for persistence metadata', async () => {
    const timestamp = Date.now().toString();
    const signature = createHmac('sha256', 'proxy-secret')
      .update(`203.0.113.25:${timestamp}`)
      .digest('hex');

    await request(app.getHttpServer())
      .post('/api/contact')
      .set('X-Forwarded-Client-Ip', '203.0.113.25')
      .set('X-Forwarded-Client-Timestamp', timestamp)
      .set('X-Forwarded-Client-Signature', signature)
      .send({
        name: 'Jan Testowy',
        email: 'jan@example.com',
        message: 'To jest poprawna wiadomosc testowa.',
      })
      .expect(200);

    expect(contactService.createAndQueueNotification).toHaveBeenCalledWith({
      name: 'Jan Testowy',
      email: 'jan@example.com',
      message: 'To jest poprawna wiadomosc testowa.',
      ip: '203.0.113.25',
      requestId: expect.any(String),
    });
  });

  it('POST /api/contact -> 413 before validation for an oversized JSON body', async () => {
    await request(app.getHttpServer())
      .post('/api/contact')
      .send({
        name: 'Jan Testowy',
        email: 'jan@example.com',
        message: 'x'.repeat(20 * 1024),
      })
      .expect(413);

    expect(contactService.createAndQueueNotification).not.toHaveBeenCalled();
  });
});
