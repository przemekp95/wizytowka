// backend/test/cors.spec.ts
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.bootstrap';
import { ContactService } from '../src/contact/contact.service';

describe('CORS', () => {
  let app: INestApplication;
  const ORIGIN = 'http://localhost:3001';
  const contactService = {
    createAndNotify: jest.fn(),
  };

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ContactService)
      .useValue(contactService)
      .compile();

    app = mod.createNestApplication();
    configureApp(app, { enableSwagger: false });
    await app.init();
  });

  beforeEach(() => {
    contactService.createAndNotify.mockReset();
    contactService.createAndNotify.mockResolvedValue({
      ok: true,
      messageId: 'msg-123',
      savedId: 'saved-123',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('preflight OPTIONS exposes ACAO', async () => {
    const res = await request(app.getHttpServer())
      .options('/graphql')
      .set('Origin', ORIGIN)
      .set('Access-Control-Request-Method', 'POST');
    expect(res.status).toBe(204);
    expect(res.header['access-control-allow-origin']).toBe(ORIGIN);
  });

  it('POST echoes ACAO', async function () {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .set('Origin', ORIGIN)
      .send({
        query: `
          mutation($input: ContactMessageInput!) {
            sendContact(input: $input) { ok }
          }
        `,
        variables: {
          input: {
            name: 'Te',
            email: 't@example.pl',
            message: 'To jest poprawna wiadomosc testowa.',
          },
        },
      });
    expect(res.status).toBe(200);
    expect(res.header['access-control-allow-origin']).toBe(ORIGIN);
  }, 5000);
});
