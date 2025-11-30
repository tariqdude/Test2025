// Modern utility functions for enhanced development experience

import { logger } from './logger';

// Export analysis cache utility
export { AnalysisCache } from './analysis-cache';

/* ==================== FORMATTING UTILITIES ==================== */

export { formatDate, formatRelativeTime } from './date';
import { formatDate, formatRelativeTime } from './date';

export { formatNumber, formatFileSize } from './format';
import { formatNumber, formatFileSize } from './format';

/* ==================== STRING UTILITIES ==================== */

export {
  slugify,
  truncate,
  titleCase,
  capitalizeFirst,
  getInitials,
  sanitizeInput,
  escapeHtml,
} from './string';
import {
  slugify,
  truncate,
  titleCase,
  capitalizeFirst,
  getInitials,
  sanitizeInput,
  escapeHtml,
} from './string';

/* ==================== ARRAY UTILITIES ==================== */

export { unique, groupBy, chunk, shuffle } from './array';
import { unique, groupBy, chunk, shuffle } from './array';

/* ==================== OBJECT UTILITIES ==================== */

export { deepMerge, pick, omit } from './object';
import { deepMerge, pick, omit } from './object';

/* ==================== URL AND QUERY UTILITIES ==================== */

export { buildUrl, parseQuery } from './url';
import { buildUrl, parseQuery } from './url';

/* ==================== CSS UTILITIES ==================== */

export { cn, cssVariables } from './css';
import { cn, cssVariables } from './css';

/* ==================== BLOG UTILITIES ==================== */

export { extractExcerpt, filterPosts } from './blog';
import { extractExcerpt, filterPosts } from './blog';

// Re-export calculateReadingTime from reading-time.ts
// Note: This changes the return type from number to ReadingTimeResult compared to the old inline version
export { calculateReadingTime } from './reading-time';
import { calculateReadingTime } from './reading-time';

/* ==================== THEME UTILITIES ==================== */

export { getPreferredColorScheme, applyColorScheme } from './theme';
import { getPreferredColorScheme, applyColorScheme } from './theme';

/* ==================== PERFORMANCE UTILITIES ==================== */

export { debounce, throttle } from './function';
import { debounce, throttle } from './function';

export { measureTime } from './performance-utils';
import { measureTime } from './performance-utils';

/* ==================== VALIDATION UTILITIES ==================== */

export { isValidEmail, isValidUrl, isEmpty } from './validation';
import { isValidEmail, isValidUrl, isEmpty } from './validation';

/* ==================== ASYNC UTILITIES ==================== */

export { sleep, retry } from './async';
import { sleep, retry } from './async';

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
  sanitizeInput,
  escapeHtml,

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
