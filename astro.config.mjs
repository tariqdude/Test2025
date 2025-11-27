// @ts-check
import 'dotenv/config';

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import { defineConfig } from 'astro/config';

const BASE_PATH = process.env.BASE_PATH || '/Github-Pages-Project-v1/';

export default defineConfig({
  // Base path only for production builds (GitHub Pages)
  base: import.meta.env.PROD ? BASE_PATH : '/',
  site:
    process.env.SITE_URL ||
    'https://tariqdude.github.io/Github-Pages-Project-v1/',
  output: 'static',
  integrations: [
    mdx(),
    sitemap(),
    tailwind({
      applyBaseStyles: false,
      configFile: './tailwind.config.ts',
    }),
  ],
});
