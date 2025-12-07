/**
 * Cache utility for storing and retrieving data with TTL support
 * @module utils/cache
 */

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
}

interface CacheOptions {
  maxSize?: number;
  defaultTtl?: number;
  /** Enable hit/miss rate tracking */
  trackMetrics?: boolean;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
}

/**
 * In-memory cache with TTL support and LRU eviction
 * @template K - Key type (default: string)
 * @template V - Value type (default: unknown)
 * @example
 * const cache = new MemoryCache<string, User>({ maxSize: 100, defaultTtl: 60000 });
 * cache.set('user:1', { name: 'John' });
 * const user = cache.get('user:1');
 */
export class MemoryCache<K = string, V = unknown> {
  private cache = new Map<K, CacheEntry<V>>();
  private accessOrder: K[] = [];
  private maxSize: number;
  private defaultTtl: number;
  private trackMetrics: boolean;
  private metrics: CacheMetrics = { hits: 0, misses: 0, evictions: 0 };

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize ?? 1000;
    this.defaultTtl = options.defaultTtl ?? 5 * 60 * 1000; // 5 minutes default
    this.trackMetrics = options.trackMetrics ?? false;
  }

  /**
   * Set a value in the cache
   * @param key - Cache key
   * @param value - Value to store
   * @param ttl - Time to live in milliseconds (optional)
   */
  set(key: K, value: V, ttl?: number): void {
    // Evict if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttl ?? this.defaultTtl,
    });

    this.updateAccessOrder(key);
  }

  /**
   * Get a value from the cache
   * @param key - Cache key
   * @returns The cached value or undefined if not found/expired
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      if (this.trackMetrics) this.metrics.misses++;
      return undefined;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.delete(key);
      if (this.trackMetrics) this.metrics.misses++;
      return undefined;
    }

    if (this.trackMetrics) this.metrics.hits++;
    this.updateAccessOrder(key);
    return entry.value;
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: K): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (this.isExpired(entry)) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a key from the cache
   */
  delete(key: K): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
    }
    return deleted;
  }

  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  /**
   * Get the number of entries in the cache
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Get all keys in the cache
   */
  keys(): K[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache statistics
   * @returns Object with size, maxSize, and optionally hit rate metrics
   */
  stats(): {
    size: number;
    maxSize: number;
    hitRate?: number;
    hits?: number;
    misses?: number;
    evictions?: number;
  } {
    const base = {
      size: this.cache.size,
      maxSize: this.maxSize,
    };

    if (this.trackMetrics) {
      const total = this.metrics.hits + this.metrics.misses;
      return {
        ...base,
        hitRate: total > 0 ? this.metrics.hits / total : 0,
        hits: this.metrics.hits,
        misses: this.metrics.misses,
        evictions: this.metrics.evictions,
      };
    }

    return base;
  }

  /**
   * Reset cache metrics
   */
  resetMetrics(): void {
    this.metrics = { hits: 0, misses: 0, evictions: 0 };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    let removed = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.delete(key);
        removed++;
      }
    }
    return removed;
  }

  private isExpired(entry: CacheEntry<V>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private updateAccessOrder(key: K): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  private evictLRU(): void {
    if (this.accessOrder.length > 0) {
      const lruKey = this.accessOrder.shift();
      if (lruKey !== undefined) {
        this.cache.delete(lruKey);
        if (this.trackMetrics) this.metrics.evictions++;
      }
    }
  }
}

/**
 * Create a simple cache with automatic expiration
 */
export function createCache<K = string, V = unknown>(
  options?: CacheOptions
): MemoryCache<K, V> {
  return new MemoryCache<K, V>(options);
}

/**
 * Memoize a function with caching
 */
export function memoizeWithCache<T extends unknown[], R>(
  fn: (...args: T) => R,
  options?: CacheOptions & { keyFn?: (...args: T) => string }
): (...args: T) => R {
  const cache = new MemoryCache<string, R>(options);
  const keyFn = options?.keyFn ?? ((...args: T) => JSON.stringify(args));

  return (...args: T): R => {
    const key = keyFn(...args);
    const cached = cache.get(key);

    if (cached !== undefined) {
      return cached;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}
