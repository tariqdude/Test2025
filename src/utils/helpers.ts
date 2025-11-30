import { BASE_PATH } from '../consts';
import { logger } from './logger';

/**
 * Normalize error to a structured format for logging
 */
const normalizeErrorContext = (error: unknown): Record<string, unknown> => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  if (typeof error === 'object' && error !== null) {
    return error as Record<string, unknown>;
  }

  return { error: String(error) };
};

/**
 * Check if localStorage is available in the current environment
 */
const isLocalStorageAvailable = (): boolean => {
  return (
    typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
  );
};

// Date utilities
export { formatDate, getRelativeTime } from './date';

// URL utilities
export { buildUrl } from './url';

const EXTERNAL_LINK_PATTERN = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;
const BASE_SKIP_PREFIXES = ['mailto:', 'tel:', '#', '?'] as const;

const trimSlashes = (value: string): string => value.replace(/^\/+|\/+$/g, '');

export function withBasePath(path: string): string {
  const trimmedBase = BASE_PATH === '/' ? '' : trimSlashes(BASE_PATH);
  const basePrefix = trimmedBase ? `/${trimmedBase}` : '';

  if (!path) {
    return basePrefix ? `${basePrefix}/` : '/';
  }

  const trimmedPath = path.trim();

  if (
    EXTERNAL_LINK_PATTERN.test(trimmedPath) ||
    BASE_SKIP_PREFIXES.some(prefix => trimmedPath.startsWith(prefix))
  ) {
    return trimmedPath;
  }

  const cleanedPath = trimmedPath.replace(/^\/+/, '');

  if (!cleanedPath) {
    return basePrefix ? `${basePrefix}/` : '/';
  }

  return `${basePrefix}/${cleanedPath}`;
}

export function resolveHref(href: string): string {
  return withBasePath(href);
}

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
export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

export function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// Local storage utilities
export function setLocalStorage<T>(key: string, value: T): void {
  if (!isLocalStorageAvailable()) {
    logger.warn('localStorage is unavailable in this environment', { key });
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    logger.warn('Failed to set localStorage entry', {
      key,
      ...normalizeErrorContext(error),
    });
  }
}

export function getLocalStorage<T>(key: string, defaultValue?: T): T | null {
  if (!isLocalStorageAvailable()) {
    logger.warn('localStorage is unavailable in this environment', { key });
    return defaultValue ?? null;
  }
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue || null;
  } catch (error) {
    logger.warn('Failed to read localStorage entry', {
      key,
      ...normalizeErrorContext(error),
    });
    return defaultValue ?? null;
  }
}

export function removeLocalStorage(key: string): void {
  if (!isLocalStorageAvailable()) {
    logger.warn('localStorage is unavailable in this environment', { key });
    return;
  }
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    logger.warn('Failed to remove localStorage entry', {
      key,
      ...normalizeErrorContext(error),
    });
  }
}

// Performance utilities
export { debounce, throttle } from './function';

// Color utilities
export function hexToRgb(
  hex: string
): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// API utilities
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

export async function fetchWithTimeout<T>(
  url: string,
  options: RequestInit = {},
  timeout = 5000
): Promise<ApiResponse<T>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP error! status: ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
