import { defineConfig } from 'vite';
import tailwindcss from 'tailwindcss';

export default defineConfig({
  plugins: [],
  css: {
    postcss: {
      plugins: [tailwindcss],
    },
  },
  build: {
    cssMinify: 'lightningcss',
  },
  esbuild: {
    logOverride: {
      'css-syntax-error': 'silent',
    },
  },
});
