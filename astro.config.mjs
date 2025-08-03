// @ts-check
import 'dotenv/config';

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Base path so assets and links resolve correctly on GitHub Pages
  base: '/Test2025/',
  site: process.env.SITE_URL || 'https://tariqdude.github.io/Test2025/',
  integrations: [mdx(), sitemap()],
});
