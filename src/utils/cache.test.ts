import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryCache, createCache, memoizeWithCache } from './cache';

describe('MemoryCache', () => {
  let cache: MemoryCache<string, number>;

  beforeEach(() => {
    cache = new MemoryCache({ maxSize: 3, defaultTtl: 1000 });
  });

  describe('set and get', () => {
    it('should store and retrieve values', () => {
      cache.set('key1', 100);
      expect(cache.get('key1')).toBe(100);
    });

    it('should return undefined for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should overwrite existing values', () => {
      cache.set('key1', 100);
      cache.set('key1', 200);
      expect(cache.get('key1')).toBe(200);
    });
  });

  describe('has', () => {
    it('should return true for existing keys', () => {
      cache.set('key1', 100);
      expect(cache.has('key1')).toBe(true);
    });

    it('should return false for non-existent keys', () => {
      expect(cache.has('nonexistent')).toBe(false);
    });
  });

  describe('delete', () => {
    it('should remove entries', () => {
      cache.set('key1', 100);
      expect(cache.delete('key1')).toBe(true);
      expect(cache.has('key1')).toBe(false);
    });

    it('should return false when deleting non-existent key', () => {
      expect(cache.delete('nonexistent')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all entries', () => {
      cache.set('key1', 100);
      cache.set('key2', 200);
      cache.clear();
      expect(cache.size).toBe(0);
    });
  });

  describe('TTL expiration', () => {
    it('should expire entries after TTL', async () => {
      vi.useFakeTimers();
      cache.set('key1', 100, 100); // 100ms TTL

      expect(cache.get('key1')).toBe(100);

      vi.advanceTimersByTime(150);

      expect(cache.get('key1')).toBeUndefined();
      vi.useRealTimers();
    });
  });

  describe('LRU eviction', () => {
    it('should evict least recently used when at capacity', () => {
      cache.set('key1', 1);
      cache.set('key2', 2);
      cache.set('key3', 3);

      // Access key1 to make it recently used
      cache.get('key1');

      // Add new key, should evict key2 (least recently used)
      cache.set('key4', 4);

      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);
      expect(cache.has('key3')).toBe(true);
      expect(cache.has('key4')).toBe(true);
    });
  });

  describe('stats', () => {
    it('should return cache statistics', () => {
      cache.set('key1', 100);
      const stats = cache.stats();
      expect(stats.size).toBe(1);
      expect(stats.maxSize).toBe(3);
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', () => {
      vi.useFakeTimers();
      cache.set('key1', 100, 50);
      cache.set('key2', 200, 200);

      vi.advanceTimersByTime(100);

      const removed = cache.cleanup();
      expect(removed).toBe(1);
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(true);
      vi.useRealTimers();
    });
  });
});

describe('createCache', () => {
  it('should create a new cache instance', () => {
    const cache = createCache<string, number>();
    cache.set('test', 42);
    expect(cache.get('test')).toBe(42);
  });
});

describe('memoizeWithCache', () => {
  it('should cache function results', () => {
    const fn = vi.fn((a: number, b: number) => a + b);
    const memoized = memoizeWithCache(fn);

    expect(memoized(1, 2)).toBe(3);
    expect(memoized(1, 2)).toBe(3);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should use custom key function', () => {
    const fn = vi.fn((obj: { id: number }) => obj.id * 2);
    const memoized = memoizeWithCache(fn, {
      keyFn: obj => String(obj.id),
    });

    expect(memoized({ id: 5 })).toBe(10);
    expect(memoized({ id: 5 })).toBe(10);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
