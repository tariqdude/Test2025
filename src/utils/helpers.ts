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
/**
 * Format a date using Intl.DateTimeFormat with customizable options
 * @param date - Date to format (Date object or ISO string)
 * @param options - Intl DateTimeFormat options
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) {
    logger.warn('Invalid date provided to formatDate', { date });
    return 'Invalid Date';
  }
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  return dateObj.toLocaleDateString('en-US', { ...defaultOptions, ...options });
}

/**
 * Get relative time string (e.g., "2 hours ago", "3 days ago")
 * @param date - Date to compare (Date object or ISO string)
 * @returns Human-readable relative time string
 */
export function getRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
    { label: 'second', seconds: 1 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
    }
  }

  return 'Just now';
}

// URL utilities
export function buildUrl(
  base: string,
  path: string,
  params?: Record<string, string>
): string {
  const url = new URL(path, base);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }
  return url.toString();
}

const EXTERNAL_LINK_PATTERN = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;
const BASE_SKIP_PREFIXES = ['mailto:', 'tel:', '#', '?'] as const;

export function withBasePath(path: string): string {
  const base = BASE_PATH || '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;

  if (!path) {
    return normalizedBase;
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
    return normalizedBase;
  }

  return `${normalizedBase}${cleanedPath}`;
}

export function resolveHref(href: string): string {
  return withBasePath(href);
}

export function getSlugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// String utilities
export function truncateText(
  text: string,
  maxLength: number,
  suffix = '...'
): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, char => char.toUpperCase());
}

// Array utilities
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce(
    (groups, item) => {
      const groupKey = String(item[key]);
      groups[groupKey] = groups[groupKey] || [];
      groups[groupKey].push(item);
      return groups;
    },
    {} as Record<string, T[]>
  );
}

export function sortBy<T>(
  array: T[],
  key: keyof T,
  direction: 'asc' | 'desc' = 'asc'
): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];

    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

export function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// Form utilities
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-()]/g, ''));
}

export function sanitizeInput(input: string): string {
  return input.replace(/[<>]/g, '').trim();
}

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
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

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
