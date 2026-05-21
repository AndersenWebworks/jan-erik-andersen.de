import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:5500/redesign',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'node tests/static-server.mjs 5500',
    port: 5500,
    reuseExistingServer: true,
  },
});
