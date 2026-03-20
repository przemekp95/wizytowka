import appConfig from './app.config';
import chatConfig from './chat.config';
import contactConfig from './contact.config';
import loggingConfig from './logging.config';
import mongoConfig from './mongo.config';
import opsConfig from './ops.config';
import throttleConfig from './throttle.config';

describe('Domain config', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('maps app env values with defaults and parsing', () => {
    process.env.NODE_ENV = 'production';
    process.env.PORT = '4100';
    process.env.FRONTEND_URL = 'https://example.com';
    process.env.CORS_ORIGINS = 'https://a.example.com, https://b.example.com';
    process.env.TRUST_PROXY = 'true';
    delete process.env.SKIP_PRISMA;

    expect(appConfig()).toEqual({
      nodeEnv: 'production',
      port: 4100,
      frontendUrl: 'https://example.com',
      corsOrigins: ['https://a.example.com', 'https://b.example.com'],
      trustProxy: true,
      skipPrisma: false,
      graphqlPlayground: false,
      graphqlIntrospection: false,
    });
  });

  it('maps contact and ops config values', () => {
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '2525';
    process.env.SMTP_SECURE = 'false';
    process.env.SMTP_FROM = 'from@example.com';
    process.env.SMTP_TO = 'to@example.com';
    process.env.SMTP_USER = 'user@example.com';
    process.env.SMTP_PASS = 'secret';
    process.env.SMTP_DEBUG = 'true';
    process.env.ADMIN_TOKEN = 'ops-secret';

    expect(contactConfig()).toEqual({
      smtpHost: 'smtp.example.com',
      smtpPort: 2525,
      smtpSecure: false,
      smtpFrom: 'from@example.com',
      smtpTo: 'to@example.com',
      smtpUser: 'user@example.com',
      smtpPass: 'secret',
      smtpDebug: true,
    });
    expect(opsConfig()).toEqual({
      adminToken: 'ops-secret',
    });
  });

  it('defaults throttle driver to memory in tests and mongo otherwise', () => {
    process.env.NODE_ENV = 'test';
    delete process.env.THROTTLE_STORAGE;

    expect(throttleConfig()).toEqual({
      driver: 'memory',
      disabled: false,
      limit: 30,
      ttlMs: 60_000,
    });

    process.env.NODE_ENV = 'production';
    expect(throttleConfig()).toEqual({
      driver: 'mongo',
      disabled: false,
      limit: 30,
      ttlMs: 60_000,
    });
  });

  it('maps chat, logging and mongo defaults', () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.LOG_LEVEL;
    delete process.env.MONGODB_URI;
    delete process.env.MONGODB_DB;

    expect(chatConfig()).toEqual({
      apiKey: undefined,
      enabled: false,
      model: 'gpt-3.5-turbo',
      maxTokens: 500,
      temperature: 0.7,
      sessionMaxAgeMs: 24 * 60 * 60 * 1000,
    });
    expect(loggingConfig()).toEqual({
      level: 'info',
    });
    expect(mongoConfig()).toEqual({
      uri: undefined,
      dbName: 'wizytowka',
    });
  });
});
