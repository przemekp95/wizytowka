import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.bootstrap';
import { PortfolioService } from '../src/portfolio/portfolio.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('OpenAPI (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PortfolioService)
      .useValue({
        listPublished: jest.fn().mockResolvedValue([]),
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

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('exposes current REST paths and security scheme in /api/docs-json', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/docs-json')
      .expect(200);

    expect(response.body.paths).toEqual(
      expect.objectContaining({
        '/api/contact': expect.objectContaining({
          post: expect.any(Object),
        }),
        '/api/graphql/schema': expect.objectContaining({
          get: expect.any(Object),
        }),
        '/api/contact/messages': expect.objectContaining({
          get: expect.any(Object),
        }),
        '/api/portfolio': expect.objectContaining({
          get: expect.any(Object),
          post: expect.any(Object),
        }),
        '/api/portfolio/{id}': expect.objectContaining({
          patch: expect.any(Object),
          delete: expect.any(Object),
        }),
        '/api/chat/message': expect.objectContaining({
          post: expect.any(Object),
        }),
        '/api/health': expect.objectContaining({
          get: expect.any(Object),
        }),
        '/api/health/live': expect.objectContaining({
          get: expect.any(Object),
        }),
        '/api/health/ready': expect.objectContaining({
          get: expect.any(Object),
        }),
        '/api/links': expect.objectContaining({
          get: expect.any(Object),
        }),
        '/api/links/r/{slug}': expect.objectContaining({
          get: expect.any(Object),
        }),
      }),
    );

    expect(response.body.paths['/api/metrics']).toBeUndefined();

    expect(response.body.components.securitySchemes).toEqual(
      expect.objectContaining({
        'admin-token': expect.objectContaining({
          type: 'http',
          scheme: 'bearer',
        }),
      }),
    );

    expect(response.body.paths['/api/portfolio'].post.security).toEqual([
      { 'admin-token': [] },
    ]);
    expect(
      response.body.paths['/api/portfolio'].post.requestBody.content[
        'multipart/form-data'
      ],
    ).toBeDefined();
    expect(
      response.body.paths['/api/contact'].post.requestBody.content,
    ).toEqual(
      expect.objectContaining({
        'application/json': expect.any(Object),
      }),
    );
  });
});

describe('OpenAPI in production (e2e)', () => {
  let app: INestApplication;
  const originalNodeEnv = process.env.NODE_ENV;
  const originalApiDocs = process.env.ENABLE_API_DOCS;

  beforeAll(async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.ENABLE_API_DOCS;

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PortfolioService)
      .useValue({
        listPublished: jest.fn().mockResolvedValue([]),
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

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();

    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }

    if (originalApiDocs === undefined) {
      delete process.env.ENABLE_API_DOCS;
    } else {
      process.env.ENABLE_API_DOCS = originalApiDocs;
    }
  });

  it('does not expose Swagger JSON by default in production', async () => {
    await request(app.getHttpServer()).get('/api/docs-json').expect(404);
  });
});
