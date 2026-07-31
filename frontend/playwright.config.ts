import { defineConfig } from '@playwright/test';

const frontendPort = Number(process.env.E2E_FRONTEND_PORT ?? 3100);
const backendPort = Number(process.env.E2E_BACKEND_PORT ?? 4100);
const frontendUrl = `http://127.0.0.1:${frontendPort}`;
const backendUrl = `http://127.0.0.1:${backendPort}`;

export default defineConfig({
  testDir: './e2e',
  timeout: 300000,
  expect: { timeout: 10000 },
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: frontendUrl,
    headless: true,
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'corepack pnpm -C ../backend start',
      url: `${backendUrl}/graphql`,
      reuseExistingServer: false,
      timeout: 600000,
      env: {
        NODE_ENV: 'test',
        PORT: String(backendPort),
        SKIP_PRISMA: 'true',
        THROTTLE_STORAGE: 'memory',
        CONTACT_NOTIFICATION_DISPATCH_ENABLED: 'false',
        SMTP_HOST: 'smtp.test.local',
        SMTP_FROM: 'from@test.local',
        SMTP_TO: 'to@test.local',
      },
    },
    {
      command: `corepack pnpm exec next dev --hostname 127.0.0.1 --port ${frontendPort}`,
      url: frontendUrl,
      reuseExistingServer: false,
      timeout: 600000,
      env: {
        NODE_ENV: 'test',
        PORT: String(frontendPort),
        BACKEND_GRAPHQL_URL: `${backendUrl}/graphql`,
        BACKEND_API_URL: 'http://127.0.0.1:65535',
      },
    },
  ],
});
