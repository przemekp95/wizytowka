import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.bootstrap';
import { PrismaService } from '../src/prisma/prisma.service';
import { MetricsService } from '../src/metrics/metrics.service';

describe('Ops auth (e2e)', () => {
  let app: INestApplication;
  const prismaService = {
    contactMessage: {
      findMany: jest.fn(),
    },
  };
  const metricsService = {
    getMetrics: jest.fn(),
    recordHttpRequest: jest.fn(),
    recordError: jest.fn(),
  };

  beforeAll(async () => {
    process.env.ADMIN_TOKEN = 'test-admin-token';

    const mod = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaService)
      .overrideProvider(MetricsService)
      .useValue(metricsService)
      .compile();

    app = mod.createNestApplication();
    configureApp(app, { enableSwagger: false });
    await app.init();
  });

  beforeEach(() => {
    prismaService.contactMessage.findMany.mockReset();
    metricsService.getMetrics.mockReset();
    prismaService.contactMessage.findMany.mockResolvedValue([]);
    metricsService.getMetrics.mockResolvedValue('# mock metrics');
  });

  afterAll(async () => {
    delete process.env.ADMIN_TOKEN;
    await app.close();
  });

  it('rejects missing bearer token for admin contact messages', async () => {
    await request(app.getHttpServer()).get('/api/contact/messages').expect(401);
  });

  it('accepts valid bearer token for admin contact messages', async () => {
    await request(app.getHttpServer())
      .get('/api/contact/messages')
      .set('Authorization', 'Bearer test-admin-token')
      .expect(200);

    expect(prismaService.contactMessage.findMany).toHaveBeenCalled();
  });

  it('rejects missing bearer token for metrics', async () => {
    await request(app.getHttpServer()).get('/api/metrics').expect(401);
  });

  it('accepts valid bearer token for metrics', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/metrics')
      .set('Authorization', 'Bearer test-admin-token')
      .expect(200);

    expect(metricsService.getMetrics).toHaveBeenCalled();
    expect(res.text).toBe('# mock metrics');
  });
});
