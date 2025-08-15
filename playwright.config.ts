import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 90_000,
  expect: { timeout: 5000 },
  fullyParallel: true,
  reporter: [['list'], ['html', { outputFolder: 'tests/artifacts/html-report' }]],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: process.env.NO_WEB_SERVER ? undefined : {
    command: process.env.START_CMD || 'npm run dev',
    url: process.env.BASE_URL || 'http://localhost:5000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});