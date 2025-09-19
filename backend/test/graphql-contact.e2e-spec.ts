import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

// mock nodemailera, by nic nie wychodziło na zewnątrz
jest.mock('nodemailer', () => {
  const sendMail = jest.fn().mockResolvedValue({
    messageId: 'e2e-id',
    accepted: ['to@example.com'],
    rejected: [],
  });
  const createTransport = jest.fn(() => ({ sendMail }));
  return {
    __esModule: true,
    default: { createTransport },
    createTransport,
  };
});

describe('GraphQL Contact (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.SMTP_HOST = 'smtp.test.local';
    process.env.SMTP_FROM = 'from@test.local';
    process.env.SMTP_TO = 'to@test.local';
    process.env.THROTTLE_DISABLE = '1'; // jeśli AppModule to respektuje
    process.env.HCAPTCHA_MOCK = '1';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    // Ten sam ValidationPipe co w main.ts (żeby walidacja DTO działała w testach)
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidUnknownValues: false,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_FROM;
    delete process.env.SMTP_TO;
    delete process.env.THROTTLE_DISABLE;
    delete process.env.HCAPTCHA_MOCK;
    await app.close();
  });

  const gql = (query: string, variables?: Record<string, any>) =>
    request(app.getHttpServer())
      .post('/graphql')
      .set('content-type', 'application/json')
      .send(variables ? { query, variables } : { query });

  it('sendContact – zwraca ok przy poprawnych danych', async () => {
    const query = `
      mutation($input: ContactMessageInput!) {
        sendContact(input: $input) { ok }
      }
    `;
    const variables = {
      input: { name: 'Jan', email: 'jan@test.com', message: 'Treść z e2e' },
    };

    const res = await gql(query, variables).expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?.sendContact?.ok).toBeTruthy();
  });

  it('sendContact – walidacja e-maila (zły email)', async () => {
    const query = `
      mutation($input: ContactMessageInput!) {
        sendContact(input: $input) { ok }
      }
    `;
    const variables = {
      input: { name: 'Jan', email: 'not-an-email', message: 'Hej' },
    };

    const res = await gql(query, variables);

    // Dopuszczamy GraphQL 200 z errors albo globalny 400
    expect([200, 400]).toContain(res.status);

    const errors = res.body?.errors as Array<any> | undefined;

    if (errors?.length) {
      // Łapiemy komunikat niezależnie od miejsca (message/extensions/response)
      const blob = JSON.stringify(errors).toLowerCase();
      expect(blob).toMatch(/email|invalid|niepopraw|format|validation/);
    } else {
      // Brak errors => kontrakt resolvera { ok: false }
      expect(res.body?.data?.sendContact?.ok).toBe(false);
    }
  });
});
