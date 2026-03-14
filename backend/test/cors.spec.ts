// backend/test/cors.spec.ts
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { ConfigModule } from '@nestjs/config';
import { ContactService } from '../src/contact/contact.service';

describe('CORS', () => {
  let app: INestApplication;
  const ORIGIN = 'http://localhost:3001';

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      imports: [
        // Override config for test environment to provide AWS credentials
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: [], // Don't load .env file
          load: [
            () => ({
              aws: {
                s3: {
                  bucketName: 'test-bucket',
                },
                region: 'us-east-1',
                accessKeyId: 'test-key',
                secretAccessKey: 'test-secret',
              },
              database: {
                url: 'postgresql://test:test@localhost:5432/test',
              },
            }),
          ],
        }),
        AppModule,
      ],
    })
      .overrideProvider(ContactService)
      .useValue({
        createAndNotify: jest.fn().mockResolvedValue({
          ok: true,
          messageId: 'msg-123',
          savedId: 'saved-123',
        }),
      })
      .compile();

    app = mod.createNestApplication();

    // Konfiguracja CORS jak w main.ts
    app.enableCors({
      origin: (
        origin: string | undefined,
        cb: (error: Error | null, allow?: boolean) => void,
      ) => {
        if (!origin) return cb(null, true);
        const allowedOrigins = new Set([
          'http://localhost:3000',
          'http://localhost:3001',
        ]);
        if (allowedOrigins.has(origin)) return cb(null, true);
        return cb(new Error(`CORS blocked for origin: ${origin}`), false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: ['Set-Cookie'],
      maxAge: 600,
    });

    app.setGlobalPrefix('api');

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('preflight OPTIONS exposes ACAO', async () => {
    const res = await request(app.getHttpServer())
      .options('/api/contact')
      .set('Origin', ORIGIN)
      .set('Access-Control-Request-Method', 'POST');
    expect(res.status).toBe(204);
    expect(res.header['access-control-allow-origin']).toBe(ORIGIN);
  });

  it('POST echoes ACAO', async function () {
    const res = await request(app.getHttpServer())
      .post('/api/contact')
      .set('Origin', ORIGIN)
      .send({ name: 'T', email: 't@example.pl', message: 'Test message' });
    expect(res.status).toBe(200);
    expect(res.header['access-control-allow-origin']).toBe(ORIGIN);
  }, 5000);
});
