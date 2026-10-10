import { defineConfig } from '@playwright/test';

/** Brief compliance audit (e2e/brief-audit.spec.ts). `npm run audit` runs it and builds audit/BRIEF_COMPLIANCE.md + audit/index.html. */
export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  expect: { timeout: 4_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5210',
    channel: 'chrome',
    headless: true,
    viewport: { width: 1280, height: 800 },
  },
  webServer: {
    command: 'npx vite --port 5210 --strictPort',
    url: 'http://localhost:5210',
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [
    { name: '1280', use: { viewport: { width: 1280, height: 800 } }, grep: /@full|@all/ },
    { name: '1440', use: { viewport: { width: 1440, height: 900 } }, grep: /@all/ },
    { name: '1920', use: { viewport: { width: 1920, height: 1080 } }, grep: /@all/ },
  ],
});
