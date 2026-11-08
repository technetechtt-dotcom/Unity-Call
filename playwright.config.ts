import { defineConfig } from '@playwright/test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}
  },
  webServer: [
    {
      command: 'node --experimental-strip-types server/src/index.ts',
      url: 'http://127.0.0.1:8787/api/health',
      env: { NODE_ENV: 'test', DATA_DIR: mkdtempSync(path.join(tmpdir(), 'unity-browser-')), APP_ORIGIN: 'http://127.0.0.1:5173', PORT: '8787' },
      reuseExistingServer: false
    },
    { command: 'npx vite --host 127.0.0.1 --strictPort', url: 'http://127.0.0.1:5173', reuseExistingServer: false }
  ]
});
