import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Relative asset URLs, so dist/ works from any static file server.
  base: './',
  test: {
    include: ['tests/unit/**/*.test.ts'],
  },
});
