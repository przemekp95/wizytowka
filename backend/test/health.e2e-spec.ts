import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.bootstrap';
import { PortfolioService } from '../src/portfolio/portfolio.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Health (e2e)', () => {
  let app: INestApplication;
  let healthyApp: INestApplication;

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = mod.createNestApplication();
    configureApp(app, { enableSwagger: false });
    await app.init();

    const healthyModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PortfolioService)
      .useValue({
        getDependencyStatus: jest.fn().mockResolvedValue({
          name: 'mongo',
          ready: true,
        }),
      })
      .overrideProvider(PrismaService)
      .useValue({
        getDependencyStatus: jest.fn().mockResolvedValue({
          name: 'prisma',
          ready: true,
        }),
      })
      .compile();

    healthyApp = healthyModule.createNestApplication();
    configureApp(healthyApp, { enableSwagger: false });
    await healthyApp.init();
  });

  afterAll(async () => {
    await app.close();
    await healthyApp.close();
  });

  it('GET /api/health -> 200', async () => {
    await request(app.getHttpServer()).get('/api/health').expect(200);
  });

  it('GET /api/health/ready -> 503 when dependencies are unavailable', async () => {
    const res = await request(app.getHttpServer()).get('/api/health/ready').expect(503);

    expect(res.body).toEqual(
      expect.objectContaining({
        ok: false,
        ready: false,
        dependencies: expect.objectContaining({
          prisma: expect.objectContaining({ ready: true }),
          mongo: expect.objectContaining({ ready: false }),
        }),
        timestamp: expect.any(String),
      }),
    );
  });

  it('GET /api/health/ready -> 200 when dependencies are healthy', async () => {
    const res = await request(healthyApp.getHttpServer()).get('/api/health/ready').expect(200);

    expect(res.body).toEqual({
      ok: true,
      ready: true,
      dependencies: {
        prisma: { name: 'prisma', ready: true },
        mongo: { name: 'mongo', ready: true },
      },
      timestamp: expect.any(String),
    });
  });
});
