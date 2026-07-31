import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ContactService } from '../src/contact/contact.service';
import { configureApp } from '../src/app.bootstrap';
import { GqlThrottlerGuard } from '../src/common/guards/gql-throttler.guard';

describe('GraphQL Contact (e2e)', () => {
  let app: INestApplication;
  const contactService = {
    createAndQueueNotification: jest.fn(),
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

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    app.get(GqlThrottlerGuard).reset();
    contactService.createAndQueueNotification.mockReset();
    contactService.createAndQueueNotification.mockResolvedValue({
      ok: true,
      savedId: 'saved-123',
    });
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

  it('sendContact – throttles repeated requests on GraphQL', async () => {
    const query = `
      mutation($input: ContactMessageInput!) {
        sendContact(input: $input) { ok }
      }
    `;
    const variables = {
      input: {
        name: 'Jan Testowy',
        email: 'jan@test.com',
        message: 'To jest poprawna wiadomosc testowa.',
      },
    };

    for (let i = 0; i < 30; i++) {
      await gql(query, variables).expect(200);
    }

    const throttled = await gql(query, variables);

    expect(throttled.status).toBe(429);
    expect(JSON.stringify(throttled.body).toLowerCase()).toMatch(/rate|throttle|too many/i);
    expect(contactService.createAndQueueNotification).toHaveBeenCalledTimes(30);
  });
});
