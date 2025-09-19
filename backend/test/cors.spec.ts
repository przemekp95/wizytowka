// backend/test/cors.spec.ts
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';

describe('CORS', () => {
  let app: INestApplication;
  const ORIGIN = 'http://localhost:3001';

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = mod.createNestApplication();
    // ważne: konfiguracja z main.ts (CORS/helmet) powinna tu też być, np. przez bootstrap helper
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
