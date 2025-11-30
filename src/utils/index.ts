// Modern utility functions for enhanced development experience

import type { BlogPost, SearchFilters, ColorScheme } from '../types/index';
import { logger } from './logger';

// Export analysis cache utility
export { AnalysisCache } from './analysis-cache';

/* ==================== FORMATTING UTILITIES ==================== */

export { formatDate, formatRelativeTime } from './date';
import { formatDate, formatRelativeTime } from './date';

/**
 * Format numbers with proper localization
 */
export const formatNumber = (
  num: number,
  options: Intl.NumberFormatOptions = {},
  locale = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, options).format(num);
};

/**
 * Format file sizes in human-readable format
 */
export const formatFileSize = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/* ==================== STRING UTILITIES ==================== */

export {
  slugify,
  truncate,
  titleCase,
  capitalizeFirst,
  getInitials,
  sanitizeInput,
} from './string';
import {
  slugify,
  truncate,
  titleCase,
  capitalizeFirst,
  getInitials,
  sanitizeInput,
} from './string';

/* ==================== ARRAY UTILITIES ==================== */

export { unique, groupBy, chunk, shuffle } from './array';
import { unique, groupBy, chunk, shuffle } from './array';

/* ==================== OBJECT UTILITIES ==================== */

/**
 * Deep merge objects with proper type safety
 */
export const deepMerge = <T extends Record<string, unknown>>(
  target: T,
  ...sources: Partial<T>[]
): T => {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(
          target[key] as Record<string, unknown>,
          source[key] as Record<string, unknown>
        );
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return deepMerge(target, ...sources);
};

/**
 * Pick specific keys from object
 */
export const pick = <T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
};

/**
 * Omit specific keys from object
 */
export const omit = <T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> => {
  const result = { ...obj } as Omit<T, K>;
  keys.forEach(key => {
    delete (result as Record<string, unknown>)[key as string];
  });
  return result;
};

/* ==================== URL AND QUERY UTILITIES ==================== */

export { buildUrl, parseQuery } from './url';
import { buildUrl, parseQuery } from './url';

/* ==================== CSS UTILITIES ==================== */

/**
 * Combine CSS class names conditionally
 */
export const cn = (
  ...classes: (string | undefined | null | false)[]
): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Generate CSS variables object for dynamic theming
 */
export const cssVariables = (
  variables: Record<string, string | number>
): Record<string, string> => {
  const result: Record<string, string> = {};

  Object.entries(variables).forEach(([key, value]) => {
    result[`--${key}`] = String(value);
  });

  return result;
};

/* ==================== BLOG UTILITIES ==================== */

/**
 * Calculate reading time for blog posts
 */
export const calculateReadingTime = (content: string, wpm = 200): number => {
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wpm);
};

/**
 * Extract excerpt from blog post content
 */
export const extractExcerpt = (
  content: string,
  maxLength = 160,
  suffix = '...'
): string => {
  // Remove markdown and HTML
  const plainText = content
    .replace(/!\[.*?\]\(.*?\)/g, '') // Images
    .replace(/\[.*?\]\(.*?\)/g, '') // Links
    .replace(/#{1,6}\s/g, '') // Headers
    .replace(/[*_]{1,2}(.*?)[*_]{1,2}/g, '$1') // Bold/italic
    .replace(/<[^>]*>/g, '') // HTML tags
    .replace(/\n+/g, ' ') // Line breaks
    .trim();

  return truncate(plainText, maxLength, suffix);
};

/**
 * Filter and sort blog posts
 */
export const filterPosts = (
  posts: BlogPost[],
  filters: SearchFilters
): BlogPost[] => {
  let filtered = [...posts];

  // Filter by query
  if (filters.query) {
    const query = filters.query.toLowerCase();
    filtered = filtered.filter(
      post =>
        post.frontmatter.title.toLowerCase().includes(query) ||
        post.frontmatter.description.toLowerCase().includes(query) ||
        post.frontmatter.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  }

  // Filter by category
  if (filters.category) {
    filtered = filtered.filter(
      post => post.frontmatter.category === filters.category
    );
  }

  // Filter by tags
  if (filters.tags && filters.tags.length > 0) {
    filtered = filtered.filter(post =>
      filters.tags?.some(tag => post.frontmatter.tags?.includes(tag))
    );
  }

  // Filter by date range
  if (filters.dateFrom) {
    const dateFrom = filters.dateFrom;
    filtered = filtered.filter(post => post.frontmatter.pubDate >= dateFrom);
  }

  if (filters.dateTo) {
    const dateTo = filters.dateTo;
    filtered = filtered.filter(post => post.frontmatter.pubDate <= dateTo);
  }

  // Filter by author
  if (filters.author) {
    filtered = filtered.filter(
      post => post.frontmatter.author === filters.author
    );
  }

  // Sort posts
  const sortBy = filters.sortBy || 'date';
  const sortOrder = filters.sortOrder || 'desc';

  filtered.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'date':
        comparison =
          a.frontmatter.pubDate.getTime() - b.frontmatter.pubDate.getTime();
        break;
      case 'title':
        comparison = a.frontmatter.title.localeCompare(b.frontmatter.title);
        break;
      default:
        comparison = 0;
    }

    return sortOrder === 'desc' ? -comparison : comparison;
  });

  return filtered;
};

/* ==================== THEME UTILITIES ==================== */

/**
 * Detect user's preferred color scheme
 */
export const getPreferredColorScheme = (): ColorScheme => {
  if (typeof window === 'undefined') return 'light';

  const stored = localStorage.getItem('color-scheme') as ColorScheme;
  if (stored && ['light', 'dark', 'system'].includes(stored)) {
    return stored;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

/**
 * Apply color scheme to document
 */
export const applyColorScheme = (scheme: ColorScheme): void => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  if (scheme === 'system') {
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;
    root.classList.toggle('dark', prefersDark);
  } else {
    root.classList.toggle('dark', scheme === 'dark');
  }

  localStorage.setItem('color-scheme', scheme);
};

/* ==================== PERFORMANCE UTILITIES ==================== */

export { debounce, throttle } from './function';
import { debounce, throttle } from './function';

/**
 * Measure function execution time
 */
export const measureTime = async <T>(
  fn: () => Promise<T> | T,
  label?: string
): Promise<{ result: T; duration: number }> => {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;

  if (label) {
    logger.debug('Function timing captured', {
      label,
      duration: Number(duration.toFixed(2)),
    });
  }

  return { result, duration };
};

/* ==================== VALIDATION UTILITIES ==================== */

export { isValidEmail, isValidUrl, isEmpty } from './validation';
import { isValidEmail, isValidUrl, isEmpty } from './validation';

/* ==================== HELPER FUNCTIONS ==================== */

/**
 * Type guard for objects
 */
const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

/**
 * Sleep utility for async operations
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry function with exponential backoff
 */
export const retry = async <T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delay = 1000
): Promise<T> => {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxAttempts) {
        throw lastError;
      }

      await sleep(delay * Math.pow(2, attempt - 1));
    }
  }

  // This should never be reached due to the throw above, but TypeScript needs it
  throw lastError || new Error('Unknown error in retry function');
};

/* ==================== DEFAULT EXPORT ==================== */

// Export all utilities as a single object
const utils = {
  // Formatting
  formatDate,
  formatRelativeTime,
  formatNumber,
  formatFileSize,

  // Strings
  slugify,
  truncate,
  titleCase,
  getInitials,

  // Arrays
  unique,
  groupBy,
  chunk,
  shuffle,

  // Objects
  deepMerge,
  pick,
  omit,

  // URLs
  buildUrl,
  parseQuery,

  // CSS
  cn,
  cssVariables,

  // Blog
  calculateReadingTime,
  extractExcerpt,
  filterPosts,

  // Theme
  getPreferredColorScheme,
  applyColorScheme,

  // Performance
  debounce,
  throttle,
  measureTime,

  // Validation
  isValidEmail,
  isValidUrl,
  isEmpty,

  // Async
  sleep,
  retry,
};

export default utils;
