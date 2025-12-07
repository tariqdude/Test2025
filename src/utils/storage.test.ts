import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isLocalStorageAvailable,
  isSessionStorageAvailable,
  setLocalStorage,
  getLocalStorage,
  removeLocalStorage,
} from './storage';

describe('Storage Utilities', () => {
  const mockStorage = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
    };
  })();

  beforeEach(() => {
    vi.stubGlobal('localStorage', mockStorage);
    mockStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('Availability', () => {
    it('should detect localStorage', () => {
      expect(isLocalStorageAvailable()).toBe(true);
    });

    it('should detect sessionStorage', () => {
      vi.stubGlobal('sessionStorage', mockStorage);
      expect(isSessionStorageAvailable()).toBe(true);
    });
  });

  describe('setLocalStorage', () => {
    it('should set value', () => {
      setLocalStorage('key', { a: 1 });
      expect(localStorage.setItem).toHaveBeenCalledWith('key', '{"a":1}');
    });

    it('should handle errors', () => {
      vi.spyOn(localStorage, 'setItem').mockImplementationOnce(() => {
        throw new Error('QuotaExceeded');
      });
      // Should not throw
      setLocalStorage('key', 'value');
    });
  });

  describe('getLocalStorage', () => {
    it('should get value', () => {
      localStorage.setItem('key', '{"a":1}');
      expect(getLocalStorage('key')).toEqual({ a: 1 });
    });

    it('should return default value if missing', () => {
      expect(getLocalStorage('missing', 'default')).toBe('default');
    });

    it('should return null if missing and no default', () => {
      expect(getLocalStorage('missing')).toBeNull();
    });

    it('should handle parse errors', () => {
      localStorage.setItem('key', 'invalid-json');
      expect(getLocalStorage('key', 'default')).toBe('default');
    });
  });

  describe('removeLocalStorage', () => {
    it('should remove value', () => {
      removeLocalStorage('key');
      expect(localStorage.removeItem).toHaveBeenCalledWith('key');
    });
  });
});
