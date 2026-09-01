import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  define: {
    __API_BASE_URL__: JSON.stringify('http://localhost/api/b2b'),
    __AI_API_BASE_URL__: JSON.stringify('http://localhost/api/b2b-ai'),
    __USE_MOCK_API__: 'true',
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
  },
});
