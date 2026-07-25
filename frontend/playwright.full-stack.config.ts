import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/full-stack',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [['github'], ['html', { outputFolder: 'playwright-report', open: 'never' }]]
    : 'html',
  use: {
    trace: 'on-first-retry',
  },
});
