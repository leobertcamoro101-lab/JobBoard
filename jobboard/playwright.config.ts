import { defineConfig, devices } from '@playwright/test';

const WEB_PORT = 5174;
const API_PORT = 8001;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0, // the flow creates accounts, so a blind retry would collide
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://127.0.0.1:${WEB_PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      // migrate is non-destructive (no "fresh"), so a wrong setting can't wipe anything
      command: `php artisan migrate --force && php artisan serve --no-reload --host=127.0.0.1 --port=${API_PORT}`,
      cwd: '../jobboard-api',
      url: `http://127.0.0.1:${API_PORT}/api/jobs`,
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
      env: {
        DB_CONNECTION: 'pgsql',
        DB_DATABASE: 'jobboard_e2e',
        REQUIRE_EMAIL_CONFIRMATION: 'false',
        CACHE_STORE: 'array', // keeps auth rate limits from tripping repeated runs
        SESSION_DRIVER: 'array',
        QUEUE_CONNECTION: 'sync',
        MAIL_MAILER: 'array',
      },
    },
    {
      command: `npm run dev -- --host 127.0.0.1 --port ${WEB_PORT} --strictPort`,
      url: `http://127.0.0.1:${WEB_PORT}`,
      timeout: 60_000,
      reuseExistingServer: !process.env.CI,
      env: {
        VITE_API_URL: '/api', // use the proxy, so there's no cross-origin traffic
        API_PROXY_TARGET: `http://127.0.0.1:${API_PORT}`,
      },
    },
  ],
});