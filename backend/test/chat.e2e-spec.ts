import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.bootstrap';

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

  it('POST /api/chat/message -> 503 with stable error payload when chat is disabled', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/chat/message')
      .send({ message: 'Czesc' })
      .expect(503);

    expect(response.body).toEqual({
      error: 'Chat is unavailable because OPENAI_API_KEY is not configured.',
      code: 'CHAT_UNAVAILABLE',
    });
  });
});
