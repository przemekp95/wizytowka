import { execFileSync, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.bootstrap';
import { GqlThrottleStorageService } from '../src/common/guards/gql-throttle-storage.service';
import { ContactService } from '../src/contact/contact.service';

jest.setTimeout(120_000);

const DOCKER_AVAILABLE =
  spawnSync('docker', ['version', '--format', '{{.Server.Version}}'], {
    encoding: 'utf8',
  }).status === 0;
const nginxIt = DOCKER_AVAILABLE ? it : it.skip;

describe('GraphQL Contact shared throttling (e2e)', () => {
  let appA: INestApplication | undefined;
  let appB: INestApplication | undefined;
  let mongoServer: MongoMemoryServer | undefined;
  let appAOrigin = '';
  let appBOrigin = '';

  const originalEnv = {
    throttleStorage: process.env.THROTTLE_STORAGE,
    mongodbUri: process.env.MONGODB_URI,
    mongodbDb: process.env.MONGODB_DB,
  };

  const contactServiceA = {
    createAndQueueNotification: jest.fn(),
  };
  const contactServiceB = {
    createAndQueueNotification: jest.fn(),
  };

  async function createApp(contactService: {
    createAndQueueNotification: jest.Mock;
  }) {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ContactService)
      .useValue(contactService)
      .compile();

    const app = moduleRef.createNestApplication();
    configureApp(app, { enableSwagger: false });
    await app.listen(0, '0.0.0.0');

    const address = app.getHttpServer().address() as AddressInfo;

    return {
      app,
      origin: `http://127.0.0.1:${address.port}`,
    };
  }

  function runDocker(args: string[]): string {
    return execFileSync('docker', args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  }

  function buildNginxProxyConfig(targets: string[], hostAlias: string): string {
    const upstreamServers = targets
      .map((target) => {
        const url = new URL(target);
        return `server ${hostAlias}:${url.port};`;
      })
      .join('\n    ');

    return `
upstream backend_pool {
    zone backend_pool 64k;
    ${upstreamServers}
}

server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://backend_pool;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
`.trimStart();
  }

  async function waitForNginx(origin: string): Promise<void> {
    for (let attempt = 0; attempt < 40; attempt++) {
      try {
        const response = await request(origin).get('/api/health/live');
        if (response.status === 200) {
          return;
        }
      } catch {
        // NGINX is still starting or the upstreams are not reachable yet.
      }

      await delay(250);
    }

    throw new Error(`NGINX did not become ready at ${origin}`);
  }

  async function startNginxLoadBalancer(targets: string[]) {
    const configDir = await mkdtemp(join(tmpdir(), 'wizytowka-nginx-'));
    const configPath = join(configDir, 'default.conf');

    await writeFile(
      configPath,
      buildNginxProxyConfig(targets, 'host.docker.internal'),
      'utf8',
    );

    let containerId = '';

    try {
      containerId = runDocker([
        'run',
        '--rm',
        '--detach',
        '--add-host',
        'host.docker.internal:host-gateway',
        '--publish',
        '127.0.0.1::80',
        '--volume',
        `${configPath}:/etc/nginx/conf.d/default.conf:ro`,
        'nginx:1.27-alpine',
      ]);

      const portOutput = runDocker(['port', containerId, '80/tcp']);
      const portMatch = portOutput.match(/:(\d+)\s*$/m);

      if (!portMatch) {
        throw new Error(`Unable to resolve published NGINX port: ${portOutput}`);
      }

      const origin = `http://127.0.0.1:${portMatch[1]}`;
      await waitForNginx(origin);

      return {
        origin,
        async stop() {
          if (containerId) {
            try {
              runDocker(['rm', '--force', containerId]);
            } catch {
              // The container may already be gone after a failed startup.
            }
          }

          await rm(configDir, { recursive: true, force: true });
        },
      };
    } catch (error) {
      const logs =
        containerId === ''
          ? ''
          : (() => {
              try {
                return runDocker(['logs', containerId]);
              } catch {
                return '';
              }
            })();

      if (containerId) {
        try {
          runDocker(['rm', '--force', containerId]);
        } catch {
          // Best-effort cleanup after a failed Docker startup.
        }
      }

      await rm(configDir, { recursive: true, force: true });

      throw new Error(
        `Failed to start NGINX load balancer: ${
          error instanceof Error ? error.message : String(error)
        }${logs ? `\nNGINX logs:\n${logs}` : ''}`,
      );
    }
  }

  const gql = (
    origin: string,
    query: string,
    variables?: Record<string, unknown>,
  ) =>
    request(origin)
      .post('/graphql')
      .set('content-type', 'application/json')
      .send(variables ? { query, variables } : { query });

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();

    process.env.THROTTLE_STORAGE = 'mongo';
    process.env.MONGODB_URI = mongoServer.getUri();
    process.env.MONGODB_DB = `throttle-${randomUUID()}`;

    const instanceA = await createApp(contactServiceA);
    const instanceB = await createApp(contactServiceB);

    appA = instanceA.app;
    appB = instanceB.app;
    appAOrigin = instanceA.origin;
    appBOrigin = instanceB.origin;
  });

  afterAll(async () => {
    if (appA) {
      await appA.close();
    }

    if (appB) {
      await appB.close();
    }

    if (mongoServer) {
      await mongoServer.stop();
    }

    if (originalEnv.throttleStorage === undefined) {
      delete process.env.THROTTLE_STORAGE;
    } else {
      process.env.THROTTLE_STORAGE = originalEnv.throttleStorage;
    }

    if (originalEnv.mongodbUri === undefined) {
      delete process.env.MONGODB_URI;
    } else {
      process.env.MONGODB_URI = originalEnv.mongodbUri;
    }

    if (originalEnv.mongodbDb === undefined) {
      delete process.env.MONGODB_DB;
    } else {
      process.env.MONGODB_DB = originalEnv.mongodbDb;
    }
  });

  beforeEach(() => {
    contactServiceA.createAndQueueNotification.mockReset();
    contactServiceB.createAndQueueNotification.mockReset();

    contactServiceA.createAndQueueNotification.mockResolvedValue({
      ok: true,
      savedId: 'saved-a',
    });
    contactServiceB.createAndQueueNotification.mockResolvedValue({
      ok: true,
      savedId: 'saved-b',
    });

    return appA?.get(GqlThrottleStorageService).clearAll();
  });

  it('shares the GraphQL rate limit between two backend instances', async () => {
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

    for (let i = 0; i < 15; i++) {
      await gql(appAOrigin, query, variables).expect(200);
      await gql(appBOrigin, query, variables).expect(200);
    }

    const throttled = await gql(appBOrigin, query, variables);

    expect(throttled.status).toBe(429);
    expect(JSON.stringify(throttled.body).toLowerCase()).toMatch(
      /rate|throttle|too many/i,
    );
    expect(contactServiceA.createAndQueueNotification).toHaveBeenCalledTimes(15);
    expect(contactServiceB.createAndQueueNotification).toHaveBeenCalledTimes(15);
  });

  nginxIt(
    'enforces the shared limit through an NGINX round-robin load balancer',
    async () => {
      const loadBalancer = await startNginxLoadBalancer([appAOrigin, appBOrigin]);

      try {
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
          await gql(loadBalancer.origin, query, variables).expect(200);
        }

        const throttled = await gql(loadBalancer.origin, query, variables);

        expect(throttled.status).toBe(429);
        expect(JSON.stringify(throttled.body).toLowerCase()).toMatch(
          /rate|throttle|too many/i,
        );
        expect(contactServiceA.createAndQueueNotification).toHaveBeenCalled();
        expect(contactServiceB.createAndQueueNotification).toHaveBeenCalled();
        expect(
          contactServiceA.createAndQueueNotification.mock.calls.length +
            contactServiceB.createAndQueueNotification.mock.calls.length,
        ).toBe(30);
      } finally {
        await loadBalancer.stop();
      }
    },
  );
});
