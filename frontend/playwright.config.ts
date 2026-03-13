import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 300000,
  expect: { timeout: 10000 },
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'pnpm -C ../backend dev',
      url: 'http://localhost:4000/graphql',
      reuseExistingServer: true,
      timeout: 600000,
      env: {
        NODE_ENV: 'test',
        PORT: '4000',
        THROTTLE_DISABLE: '1',
        SMTP_HOST: 'smtp.test.local',
        SMTP_FROM: 'from@test.local',
        SMTP_TO: 'to@test.local',
      },
    },
    {
      command: 'pnpm dev',
      url: 'http://localhost:3000',
      reuseExistingServer: true,
      timeout: 600000,
      env: {
        NODE_ENV: 'test',
        PORT: '3000',
        NEXT_PUBLIC_GRAPHQL_URL: 'http://localhost:4000/graphql',
        NEXT_PUBLIC_API_URL: 'http://localhost:4000',
      },
    },
  ],
});
