import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.bootstrap';
import { ChatHttpThrottlerGuard } from '../src/common/guards/public-http-throttler.guard';

describe('Chat HTTP (e2e)', () => {
  let app: INestApplication;
  const originalOpenAiApiKey = process.env.OPENAI_API_KEY;

  beforeAll(async () => {
    delete process.env.OPENAI_API_KEY;

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app, { enableSwagger: false });
    await app.init();
  });

  afterAll(async () => {
    if (originalOpenAiApiKey === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = originalOpenAiApiKey;
    }

    await app.close();
  });

  beforeEach(() => {
    (app.get(ChatHttpThrottlerGuard) as any).storage.reset();
  });

  it('POST /api/chat/message -> 429 after the chat public HTTP limit is exceeded', async () => {
    for (let index = 0; index < 20; index += 1) {
      await request(app.getHttpServer())
        .post('/api/chat/message')
        .send({ message: `Czesc ${index}` })
        .expect(503);
    }

    const response = await request(app.getHttpServer())
      .post('/api/chat/message')
      .send({ message: 'Czesc ponownie' })
      .expect(429);

    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'Too Many Requests',
        code: 'TOO_MANY_REQUESTS',
      }),
    );
  });

  it('POST /api/chat/message -> 400 for a client-chosen non-UUID session id', async () => {
    await request(app.getHttpServer())
      .post('/api/chat/message')
      .send({ message: 'Czesc', sessionId: 'shared-session' })
      .expect(400);
  });
});
