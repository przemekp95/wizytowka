import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

// Mock nodemailer to prevent external email delivery during tests.
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
    process.env.THROTTLE_DISABLE = '1'; // if AppModule respects this flag

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    // Use the same ValidationPipe as in main.ts so DTO validation works in tests.
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

    // Accept either GraphQL 200 with errors or a global 400 response.
    expect([200, 400]).toContain(res.status);

    const errors = res.body?.errors as Array<any> | undefined;

    if (errors?.length) {
      // Match the error message regardless of where GraphQL stores it.
      const blob = JSON.stringify(errors).toLowerCase();
      expect(blob).toMatch(/email|invalid|niepopraw|format|validation/);
    } else {
      // No errors array means resolver contract should return { ok: false }.
      expect(res.body?.data?.sendContact?.ok).toBe(false);
    }
  });
});
