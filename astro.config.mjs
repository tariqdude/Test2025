// @ts-check
import 'dotenv/config';

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import svelte from '@astrojs/svelte';
import solid from '@astrojs/solid-js';
import preact from '@astrojs/preact';
import vue from '@astrojs/vue';
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Base path only for production builds (GitHub Pages)
  base: import.meta.env.PROD ? '/Test2025/' : '/',
  site: process.env.SITE_URL || 'https://tariqdude.github.io/Test2025/',
  output: 'static',
  integrations: [
    mdx(),
    sitemap(),
    tailwind({
      applyBaseStyles: false,
      configFile: './tailwind.config.ts',
    }),
    react({
      include: ['**/react/**/*'],
    }),
    svelte({
      include: ['**/svelte/**/*'],
    }),
    solid({
      include: ['**/solid/**/*'],
    }),
    preact({
      include: ['**/preact/**/*'],
    }),
    vue({
      include: ['src/components/vue/**/*.vue'],
    }),
  ],
});
