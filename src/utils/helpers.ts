/**
 * Helper Utilities (Deprecated - use specific modules instead)
 * This file re-exports utilities from their specific modules for backward compatibility.
 */

// Date utilities
export { formatDate, formatRelativeTime as getRelativeTime } from './date';

// URL utilities
export { buildUrl, withBasePath, resolveHref } from './url';

// String utilities
export {
  capitalizeFirst,
  sanitizeInput,
  escapeHtml,
  slugify as getSlugFromTitle,
  titleCase as capitalizeWords,
  truncate as truncateText,
} from './string';

// Array utilities
export { groupBy, sortBy, unique, chunk } from './array';

// Form utilities
export { isValidEmail as validateEmail, validatePhone } from './validation';

// Animation utilities
export { easeInOut, lerp, clamp } from './math';

// Local storage utilities
export {
  setLocalStorage,
  getLocalStorage,
  removeLocalStorage,
} from './storage';

// Performance utilities
export { debounce, throttle } from './function';

// Color utilities
export { hexToRgb, rgbToHex } from './color';

// API utilities
export { fetchWithTimeout } from './api';
export type { ApiResponse } from './api';
