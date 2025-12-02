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
 * Check if sessionStorage is available in the current environment
 */
export const isSessionStorageAvailable = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    typeof window.sessionStorage !== 'undefined'
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

/**
 * Clear all localStorage entries
 */
export function clearLocalStorage(): void {
  if (!isLocalStorageAvailable()) {
    logger.warn('localStorage is unavailable in this environment');
    return;
  }
  try {
    window.localStorage.clear();
  } catch (error) {
    logger.warn('Failed to clear localStorage', normalizeErrorContext(error));
  }
}

/**
 * Get all localStorage keys
 */
export function getLocalStorageKeys(): string[] {
  if (!isLocalStorageAvailable()) {
    return [];
  }
  try {
    return Object.keys(window.localStorage);
  } catch {
    return [];
  }
}

/**
 * Get localStorage size in bytes
 */
export function getLocalStorageSize(): number {
  if (!isLocalStorageAvailable()) {
    return 0;
  }
  try {
    let total = 0;
    for (const key in window.localStorage) {
      if (Object.prototype.hasOwnProperty.call(window.localStorage, key)) {
        total += (window.localStorage[key].length + key.length) * 2;
      }
    }
    return total;
  } catch {
    return 0;
  }
}

/**
 * Set a value in sessionStorage
 */
export function setSessionStorage<T>(key: string, value: T): void {
  if (!isSessionStorageAvailable()) {
    logger.warn('sessionStorage is unavailable in this environment', { key });
    return;
  }
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    logger.warn('Failed to set sessionStorage entry', {
      key,
      ...normalizeErrorContext(error),
    });
  }
}

/**
 * Get a value from sessionStorage
 */
export function getSessionStorage<T>(key: string, defaultValue?: T): T | null {
  if (!isSessionStorageAvailable()) {
    logger.warn('sessionStorage is unavailable in this environment', { key });
    return defaultValue ?? null;
  }
  try {
    const item = window.sessionStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue || null;
  } catch (error) {
    logger.warn('Failed to read sessionStorage entry', {
      key,
      ...normalizeErrorContext(error),
    });
    return defaultValue ?? null;
  }
}

/**
 * Remove a value from sessionStorage
 */
export function removeSessionStorage(key: string): void {
  if (!isSessionStorageAvailable()) {
    logger.warn('sessionStorage is unavailable in this environment', { key });
    return;
  }
  try {
    window.sessionStorage.removeItem(key);
  } catch (error) {
    logger.warn('Failed to remove sessionStorage entry', {
      key,
      ...normalizeErrorContext(error),
    });
  }
}

/**
 * Clear all sessionStorage entries
 */
export function clearSessionStorage(): void {
  if (!isSessionStorageAvailable()) {
    logger.warn('sessionStorage is unavailable in this environment');
    return;
  }
  try {
    window.sessionStorage.clear();
  } catch (error) {
    logger.warn('Failed to clear sessionStorage', normalizeErrorContext(error));
  }
}

/**
 * Storage item with expiration
 */
interface StorageItemWithExpiry<T> {
  value: T;
  expiry: number;
}

/**
 * Set localStorage item with expiration time
 */
export function setWithExpiry<T>(key: string, value: T, ttl: number): void {
  if (!isLocalStorageAvailable()) {
    return;
  }

  const item: StorageItemWithExpiry<T> = {
    value,
    expiry: Date.now() + ttl,
  };

  setLocalStorage(key, item);
}

/**
 * Get localStorage item with expiration check
 */
export function getWithExpiry<T>(key: string, defaultValue?: T): T | null {
  if (!isLocalStorageAvailable()) {
    return defaultValue ?? null;
  }

  const item = getLocalStorage<StorageItemWithExpiry<T>>(key);

  if (!item) {
    return defaultValue ?? null;
  }

  if (Date.now() > item.expiry) {
    removeLocalStorage(key);
    return defaultValue ?? null;
  }

  return item.value;
}

/**
 * Cookie utilities
 */
export const cookies = {
  /**
   * Set a cookie
   */
  set: (
    name: string,
    value: string,
    options: {
      days?: number;
      hours?: number;
      path?: string;
      domain?: string;
      secure?: boolean;
      sameSite?: 'Strict' | 'Lax' | 'None';
    } = {}
  ): void => {
    if (typeof document === 'undefined') return;

    let expires = '';

    if (options.days || options.hours) {
      const date = new Date();
      const ms =
        (options.days || 0) * 24 * 60 * 60 * 1000 +
        (options.hours || 0) * 60 * 60 * 1000;
      date.setTime(date.getTime() + ms);
      expires = `; expires=${date.toUTCString()}`;
    }

    const path = options.path ? `; path=${options.path}` : '; path=/';
    const domain = options.domain ? `; domain=${options.domain}` : '';
    const secure = options.secure ? '; Secure' : '';
    const sameSite = options.sameSite ? `; SameSite=${options.sameSite}` : '';

    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}${expires}${path}${domain}${secure}${sameSite}`;
  },

  /**
   * Get a cookie value
   */
  get: (name: string): string | null => {
    if (typeof document === 'undefined') return null;

    const nameEQ = encodeURIComponent(name) + '=';
    const cookies = document.cookie.split(';');

    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.indexOf(nameEQ) === 0) {
        return decodeURIComponent(cookie.substring(nameEQ.length));
      }
    }

    return null;
  },

  /**
   * Remove a cookie
   */
  remove: (name: string, path = '/'): void => {
    if (typeof document === 'undefined') return;
    document.cookie = `${encodeURIComponent(name)}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  },

  /**
   * Get all cookies as object
   */
  getAll: (): Record<string, string> => {
    if (typeof document === 'undefined') return {};

    const result: Record<string, string> = {};

    document.cookie.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name) {
        result[decodeURIComponent(name)] = decodeURIComponent(value || '');
      }
    });

    return result;
  },

  /**
   * Check if a cookie exists
   */
  has: (name: string): boolean => {
    return cookies.get(name) !== null;
  },
};

/**
 * Create a namespaced storage wrapper
 */
export function createNamespacedStorage(namespace: string) {
  const prefix = `${namespace}:`;

  return {
    set: <T>(key: string, value: T): void => {
      setLocalStorage(prefix + key, value);
    },

    get: <T>(key: string, defaultValue?: T): T | null => {
      return getLocalStorage<T>(prefix + key, defaultValue);
    },

    remove: (key: string): void => {
      removeLocalStorage(prefix + key);
    },

    clear: (): void => {
      if (!isLocalStorageAvailable()) return;

      const keys = getLocalStorageKeys();
      keys.forEach(key => {
        if (key.startsWith(prefix)) {
          removeLocalStorage(key);
        }
      });
    },

    getKeys: (): string[] => {
      if (!isLocalStorageAvailable()) return [];

      return getLocalStorageKeys()
        .filter(key => key.startsWith(prefix))
        .map(key => key.slice(prefix.length));
    },
  };
}

/**
 * IndexedDB wrapper (simplified)
 */
export class SimpleDB {
  private dbName: string;
  private storeName: string;
  private db: IDBDatabase | null = null;

  constructor(dbName: string, storeName = 'default') {
    this.dbName = dbName;
    this.storeName = storeName;
  }

  async open(): Promise<void> {
    if (typeof indexedDB === 'undefined') {
      throw new Error('IndexedDB is not available');
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' });
        }
      };
    });
  }

  async set<T>(key: string, value: T): Promise<void> {
    if (!this.db) await this.open();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put({ key, value });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.db) await this.open();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve(request.result?.value ?? null);
      };
    });
  }

  async delete(key: string): Promise<void> {
    if (!this.db) await this.open();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear(): Promise<void> {
    if (!this.db) await this.open();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async keys(): Promise<string[]> {
    if (!this.db) await this.open();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAllKeys();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve(request.result.map(key => String(key)));
      };
    });
  }

  close(): void {
    this.db?.close();
    this.db = null;
  }
}
