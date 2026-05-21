import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 90000,
  use: {
    screenshot: 'only-on-failure',
  },
});
