import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: 'http://127.0.0.1:9199',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  webServer: {
    command: 'npx tsx server/src/index.ts',
    port: 9199,
    timeout: 15_000,
    reuseExistingServer: false,
    env: {
      FLOWPLAN_PORT: '9199',
    },
  },
});
