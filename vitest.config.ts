import { defineConfig } from 'vitest/config';
import astro from '@astrojs/vitest-plugin';

export default defineConfig({
  plugins: [astro()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/'],
    },
  },
});
