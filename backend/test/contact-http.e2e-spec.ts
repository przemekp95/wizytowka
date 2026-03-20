import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.bootstrap';
import { ContactService } from '../src/contact/contact.service';

describe('Contact HTTP (e2e)', () => {
  let app: INestApplication;
  const contactService = {
    createAndNotify: jest.fn(),
  };

  beforeAll(async () => {
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

  it('POST /api/contact -> 200 with { ok: true } for valid payload', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/contact')
      .send({
        name: 'Jan Testowy',
        email: 'jan@example.com',
        message: 'To jest poprawna wiadomosc testowa.',
      })
      .expect(200);

    expect(response.body).toEqual({ ok: true });
    expect(contactService.createAndNotify).toHaveBeenCalledWith({
      name: 'Jan Testowy',
      email: 'jan@example.com',
      message: 'To jest poprawna wiadomosc testowa.',
      ip: expect.any(String),
      requestId: expect.any(String),
    });
  });

  it('POST /api/contact -> 400 for invalid payload', async () => {
    await request(app.getHttpServer())
      .post('/api/contact')
      .send({
        name: 'J',
        email: 'wrong-email',
        message: 'short',
      })
      .expect(400);

    expect(contactService.createAndNotify).not.toHaveBeenCalled();
  });

  it('POST /api/contact -> 200 with { ok: false } when service rejects delivery', async () => {
    contactService.createAndNotify.mockResolvedValue({
      ok: false,
      error: 'Nie udalo sie dostarczyc wiadomosci. Sprobuj ponownie pozniej.',
      savedId: 'saved-123',
    });

    const response = await request(app.getHttpServer())
      .post('/api/contact')
      .send({
        name: 'Jan Testowy',
        email: 'jan@example.com',
        message: 'To jest poprawna wiadomosc testowa.',
      })
      .expect(200);

    expect(response.body).toEqual({
      ok: false,
      error: 'Nie udalo sie dostarczyc wiadomosci. Sprobuj ponownie pozniej.',
    });
  });
});
