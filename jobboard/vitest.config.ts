import { defineConfig } from 'vitest/config';

// Separate from vite.config.ts on purpose: tests don't need the dev proxy,
// and Vitest uses this file instead of vite.config.ts when both exist.
export default defineConfig({
  test: {
    // Unit tests only. The Playwright specs in e2e/ are run by `playwright test`.
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
