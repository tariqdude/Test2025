// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

import { createDeploymentConfig } from '../config/deployment.js';

/**
 * Site Configuration Constants
 * Central location for all site-wide configuration values
 */
const DEPLOYMENT = createDeploymentConfig(import.meta.env);
const analyticsFlag = import.meta.env.PUBLIC_ENABLE_ANALYTICS;
const analyticsEnabled =
  analyticsFlag === 'true' ||
  analyticsFlag === '1' ||
  analyticsFlag === true;

export const SITE_TITLE = 'GitHub Pages Project v1';
export const SITE_DESCRIPTION =
  'Static intelligence for decisive operators. Build executive-ready status hubs with Astro.';
export const SITE_URL = DEPLOYMENT.siteUrl;
export const BASE_PATH = DEPLOYMENT.basePath;
export const DEPLOYMENT_CONFIG = DEPLOYMENT;

export const SITE_CONFIG = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  author: 'GitHub Pages Project Team',
  defaultLanguage: 'en-US',
  // Social links
  social: {
    github: DEPLOYMENT.repoUrl || 'https://github.com',
  },
  // SEO
  seo: {
    ogImage: '/og-image.png',
    twitterCard: 'summary_large_image' as const,
  },
  // Navigation
  nav: {
    maxMenuItems: 8,
    showSearchInHeader: true,
  },
} as const;

/**
 * Theme configuration
 */
export const THEME_CONFIG = {
  defaultTheme: 'dark' as const,
  storageKey: 'ep-theme-preference',
  supportedThemes: ['light', 'dark', 'system'] as const,
} as const;

/**
 * API/Integration configuration
 */
export const API_CONFIG = {
  baseUrl: import.meta.env.PUBLIC_API_URL || '',
  timeout: 10000,
  retryAttempts: 3,
} as const;

/**
 * Performance budgets (in bytes)
 */
export const PERFORMANCE_BUDGETS = {
  maxBundleSize: 250_000, // 250KB
  maxImageSize: 200_000, // 200KB
  maxFontSize: 100_000, // 100KB
} as const;

/**
 * Feature flags
 */
export const FEATURES = {
  enableAnalytics: analyticsEnabled,
  enablePWA: true,
  enableDarkMode: true,
  enableSearch: true,
  enableRSS: true,
} as const;
