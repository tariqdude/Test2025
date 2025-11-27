// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

/**
 * Site Configuration Constants
 * Central location for all site-wide configuration values
 */

export const SITE_TITLE = 'Github Pages Project v1';
export const SITE_DESCRIPTION =
  'Static intelligence for decisive operators. Build executive-ready status hubs with Astro.';

export const SITE_CONFIG = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  author: 'Github Pages Project Team',
  defaultLanguage: 'en-US',
  // Social links
  social: {
    github: 'https://github.com/tariqdude/Test2025',
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
  enableAnalytics: import.meta.env.PROD,
  enablePWA: true,
  enableDarkMode: true,
  enableSearch: true,
  enableRSS: true,
} as const;
