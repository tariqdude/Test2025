// @ts-check
import 'dotenv/config';

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Base path only for production builds (GitHub Pages)
  base: import.meta.env.PROD ? '/Test2025/' : '/',
  site: process.env.SITE_URL || 'https://tariqdude.github.io/Test2025/',
  integrations: [
    mdx(), 
    sitemap(),
  ],
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
});
