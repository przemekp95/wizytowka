// backend/test/cors.spec.ts
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import type { Request, Response } from 'express';

// @ts-ignore
import { beforeAll, afterAll, expect } from '@jest/globals';

describe('CORS', () => {
  let app: INestApplication;
  const ORIGIN = 'http://localhost:3001';

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = mod.createNestApplication();

    // Konfiguracja CORS jak w main.ts
    app.enableCors({
      origin: (origin: string | undefined, cb: (error: Error | null, allow?: boolean) => void) => {
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

  it('POST echoes ACAO', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/contact')
      .set('Origin', ORIGIN)
      .send({ name: 'T', email: 't@e.pl', message: 'm' });
    expect(res.status).toBe(202); // albo 200, zgodnie z twoją implementacją
    expect(res.header['access-control-allow-origin']).toBe(ORIGIN);
  });
});
