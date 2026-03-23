import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.bootstrap';
import { PortfolioService } from '../src/portfolio/portfolio.service';
import { PrismaService } from '../src/prisma/prisma.service';

async function createGraphqlDocsApp(): Promise<INestApplication> {
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

  const app = moduleRef.createNestApplication();
  configureApp(app, { enableSwagger: false });
  await app.init();

  return app;
}

describe('GraphQL docs (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createGraphqlDocsApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /graphql exposes an interactive Apollo landing page outside production', async () => {
    const response = await request(app.getHttpServer())
      .get('/graphql')
      .set('Accept', 'text/html')
      .expect(200);

    expect(response.type).toMatch(/html/);
    expect(response.text).toContain('Apollo Server');
    expect(response.text).toContain('embeddable-sandbox');
  });

  it('GET /api/graphql/schema exposes the current GraphQL SDL through a runtime endpoint', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/graphql/schema')
      .expect(200);

    expect(response.type).toMatch(/text/);
    expect(response.text).toContain(
      'Public contact form input accepted by the sendContact mutation.',
    );
    expect(response.text).toContain('type Mutation');
    expect(response.text).toContain('sendContact(input: ContactMessageInput!)');
  });

  it('POST /graphql supports introspection with documented schema metadata', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          query IntrospectionDocs {
            __schema {
              mutationType { name }
              queryType { name }
              types {
                name
                description
              }
            }
          }
        `,
      })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.__schema.mutationType.name).toBe('Mutation');
    expect(response.body.data.__schema.queryType.name).toBe('Query');

    const types = response.body.data.__schema.types as Array<{
      name: string;
      description?: string | null;
    }>;

    expect(types).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'ContactMessageInput',
          description:
            'Public contact form input accepted by the sendContact mutation.',
        }),
        expect.objectContaining({
          name: 'ContactResult',
          description:
            'Result returned after attempting to process a public contact submission.',
        }),
      ]),
    );
  });

  it('writes the GraphQL SDL with descriptions to backend/schema.gql', async () => {
    const schemaSdl = await readFile(join(process.cwd(), 'schema.gql'), 'utf8');

    expect(schemaSdl).toContain(
      'Public contact form input accepted by the sendContact mutation.',
    );
    expect(schemaSdl).toContain(
      'Submit a public contact message. This mutation is rate-limited and returns ok=false when delivery fails.',
    );
    expect(schemaSdl).toContain(
      'Minimal GraphQL hello query exposed for smoke testing and tooling checks.',
    );
  });
});

describe('GraphQL docs in production (e2e)', () => {
  let app: INestApplication;
  const originalNodeEnv = process.env.NODE_ENV;
  const originalGraphqlSchemaDocs = process.env.ENABLE_GRAPHQL_SCHEMA_DOCS;

  beforeAll(async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.ENABLE_GRAPHQL_SCHEMA_DOCS;
    app = await createGraphqlDocsApp();
  });

  afterAll(async () => {
    await app.close();

    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }

    if (originalGraphqlSchemaDocs === undefined) {
      delete process.env.ENABLE_GRAPHQL_SCHEMA_DOCS;
    } else {
      process.env.ENABLE_GRAPHQL_SCHEMA_DOCS = originalGraphqlSchemaDocs;
    }
  });

  it('hides the SDL endpoint by default without exposing the Apollo landing page', async () => {
    const schemaResponse = await request(app.getHttpServer())
      .get('/api/graphql/schema')
      .expect(404);

    const landingResponse = await request(app.getHttpServer())
      .get('/graphql')
      .set('Accept', 'text/html');

    expect(landingResponse.status).toBeGreaterThanOrEqual(400);
    expect(landingResponse.text).not.toContain('embeddable-sandbox');
  });
});
