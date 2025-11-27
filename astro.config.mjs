// @ts-check
import 'dotenv/config';

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Base path only for production builds (GitHub Pages)
  base: import.meta.env.PROD ? '/Github-Pages-Project-v1/' : '/',
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
