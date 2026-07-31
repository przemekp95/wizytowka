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
      apiDocsEnabled: false,
      graphqlSchemaDocsEnabled: false,
      internalProxySharedSecret: undefined,
    });
  });

  it('maps contact and ops config values', () => {
    process.env.CONTACT_NOTIFICATION_PROVIDER = 'resend';
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '2525';
    process.env.SMTP_SECURE = 'false';
    process.env.SMTP_FROM = 'from@example.com';
    process.env.SMTP_TO = 'to@example.com';
    process.env.SMTP_USER = 'user@example.com';
    process.env.SMTP_PASS = 'secret';
    process.env.SMTP_DEBUG = 'true';
    process.env.RESEND_API_KEY = 're_test_123';
    process.env.RESEND_WEBHOOK_SECRET = 'whsec_test_123';
    process.env.CONTACT_NOTIFICATION_DISPATCH_ENABLED = 'true';
    process.env.CONTACT_NOTIFICATION_DISPATCH_INTERVAL_MS = '1500';
    process.env.CONTACT_NOTIFICATION_DISPATCH_BATCH_SIZE = '25';
    process.env.CONTACT_NOTIFICATION_LEASE_MS = '45000';
    process.env.CONTACT_NOTIFICATION_MAX_ATTEMPTS = '6';
    process.env.CONTACT_NOTIFICATION_BASE_DELAY_MS = '5000';
    process.env.CONTACT_NOTIFICATION_MAX_DELAY_MS = '120000';
    process.env.CONTACT_NOTIFICATION_SUBMITTED_RECHECK_MS = '180000';
    process.env.CONTACT_NOTIFICATION_SUBMITTED_TIMEOUT_MS = '7200000';
    process.env.CONTACT_DATA_RETENTION_ENABLED = 'true';
    process.env.CONTACT_DATA_RETENTION_DAYS = '45';
    process.env.CONTACT_RETENTION_SWEEP_INTERVAL_MS = '1800000';
    process.env.ADMIN_TOKEN = 'ops-secret';

    expect(contactConfig()).toEqual({
      notificationProvider: 'resend',
      smtpHost: 'smtp.example.com',
      smtpPort: 2525,
      smtpSecure: false,
      smtpFrom: 'from@example.com',
      smtpTo: 'to@example.com',
      smtpUser: 'user@example.com',
      smtpPass: 'secret',
      smtpDebug: true,
      resendApiKey: 're_test_123',
      resendWebhookSecret: 'whsec_test_123',
      notificationDispatchEnabled: true,
      notificationDispatchIntervalMs: 1500,
      notificationDispatchBatchSize: 25,
      notificationLeaseMs: 45000,
      notificationMaxAttempts: 6,
      notificationBaseDelayMs: 5000,
      notificationMaxDelayMs: 120000,
      notificationSubmittedRecheckMs: 180000,
      notificationSubmittedTimeoutMs: 7200000,
      dataRetentionEnabled: true,
      dataRetentionMs: 45 * 24 * 60 * 60 * 1000,
      retentionSweepIntervalMs: 1800000,
    });
    expect(opsConfig()).toEqual({
      adminToken: 'ops-secret',
      adminTokens: ['ops-secret'],
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
      publicHttpLimit: 30,
      publicHttpTtlMs: 60_000,
      chatHttpLimit: 20,
      chatHttpTtlMs: 60_000,
      chatHttpGlobalLimit: 100,
      chatHttpGlobalTtlMs: 60_000,
    });

    process.env.NODE_ENV = 'production';
    expect(throttleConfig()).toEqual({
      driver: 'mongo',
      disabled: false,
      limit: 30,
      ttlMs: 60_000,
      publicHttpLimit: 30,
      publicHttpTtlMs: 60_000,
      chatHttpLimit: 20,
      chatHttpTtlMs: 60_000,
      chatHttpGlobalLimit: 100,
      chatHttpGlobalTtlMs: 60_000,
    });
  });

  it('maps chat, logging and mongo defaults', () => {
    delete process.env.OPENAI_API_KEY;
    process.env.CHAT_SESSION_RETENTION_MS = '3600000';
    delete process.env.LOG_LEVEL;
    delete process.env.MONGODB_URI;
    delete process.env.MONGODB_URL;
    delete process.env.MONGO_URL;
    delete process.env.MONGODB_DB;

    expect(chatConfig()).toEqual({
      apiKey: undefined,
      enabled: false,
      model: 'gpt-3.5-turbo',
      maxTokens: 500,
      temperature: 0.7,
      sessionMaxAgeMs: 60 * 60 * 1000,
    });
    expect(loggingConfig()).toEqual({
      level: 'info',
    });
    expect(mongoConfig()).toEqual({
      uri: undefined,
      dbName: 'wizytowka',
    });
  });

  it('enables production docs only when explicitly configured', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.SKIP_PRISMA;
    process.env.ENABLE_API_DOCS = 'true';
    process.env.ENABLE_GRAPHQL_SCHEMA_DOCS = 'true';
    process.env.INTERNAL_PROXY_SHARED_SECRET = 'proxy-secret';

    expect(appConfig()).toEqual({
      nodeEnv: 'production',
      port: 3000,
      frontendUrl: undefined,
      corsOrigins: [],
      trustProxy: false,
      skipPrisma: false,
      graphqlPlayground: false,
      graphqlIntrospection: false,
      apiDocsEnabled: true,
      graphqlSchemaDocsEnabled: true,
      internalProxySharedSecret: 'proxy-secret',
    });
  });

  it('accepts Mongo URI aliases and derives the database name from the URI', () => {
    delete process.env.MONGODB_URI;
    process.env.MONGODB_URL =
      'mongodb+srv://user:secret@cluster.example.net/atlas-db?retryWrites=true&w=majority';
    delete process.env.MONGO_URL;
    delete process.env.MONGODB_DB;

    expect(mongoConfig()).toEqual({
      uri: 'mongodb+srv://user:secret@cluster.example.net/atlas-db?retryWrites=true&w=majority',
      dbName: 'atlas-db',
    });
  });

  it('prefers an explicit Mongo database name over the URI path', () => {
    delete process.env.MONGODB_URI;
    delete process.env.MONGODB_URL;
    process.env.MONGO_URL =
      'mongodb+srv://user:secret@cluster.example.net/atlas-db?retryWrites=true&w=majority';
    process.env.MONGODB_DB = 'override-db';

    expect(mongoConfig()).toEqual({
      uri: 'mongodb+srv://user:secret@cluster.example.net/atlas-db?retryWrites=true&w=majority',
      dbName: 'override-db',
    });
  });
});
