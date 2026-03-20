import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.bootstrap';
import { LoggingService } from '../src/logging/logging.service';
import { MetricsService } from '../src/metrics/metrics.service';

describe('App HTTP (e2e)', () => {
  let app: INestApplication;
  const loggingService = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    logRequest: jest.fn(),
    logDatabase: jest.fn(),
  };
  const metricsService = {
    recordHttpRequest: jest.fn(),
    incrementActiveConnections: jest.fn(),
    decrementActiveConnections: jest.fn(),
    recordDatabaseOperation: jest.fn(),
    recordError: jest.fn(),
    getMetrics: jest.fn(),
    getRegister: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(LoggingService)
      .useValue(loggingService)
      .overrideProvider(MetricsService)
      .useValue(metricsService)
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app, { enableSwagger: false });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api -> Hello World! with request tracing and metrics', async () => {
    const response = await request(app.getHttpServer())
      .get('/api')
      .expect(200)
      .expect('Hello World!');

    expect(response.header['x-request-id']).toEqual(expect.any(String));
    expect(loggingService.info).toHaveBeenCalledWith(
      'Request started: GET /api',
      expect.objectContaining({
        requestId: expect.any(String),
      }),
    );
    expect(loggingService.logRequest).toHaveBeenCalledWith(
      'GET',
      '/api',
      200,
      expect.any(Number),
      expect.any(String),
    );
    expect(metricsService.recordHttpRequest).toHaveBeenCalledWith(
      'GET',
      '/api',
      200,
      expect.any(Number),
    );
  });
});
