import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.bootstrap';
import { LoggingService } from '../src/logging/logging.service';

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
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(LoggingService)
      .useValue(loggingService)
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app, { enableSwagger: false });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api -> Hello World! with request tracing and logging', async () => {
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
  });
});
