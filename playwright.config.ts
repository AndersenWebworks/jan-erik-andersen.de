import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:5500/redesign',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'python -m http.server 5500',
    port: 5500,
    reuseExistingServer: true,
  },
});
