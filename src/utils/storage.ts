/**
 * Local Storage Utilities
 */

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
export const isLocalStorageAvailable = (): boolean => {
  return (
    typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
  );
};

/**
 * Set a value in localStorage
 */
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

/**
 * Get a value from localStorage
 */
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

/**
 * Remove a value from localStorage
 */
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
