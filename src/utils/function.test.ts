import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  debounce,
  throttle,
  debounceLeading,
  throttleTrailing,
  memoize,
} from './function';

describe('Function Utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('debounce', () => {
    it('should debounce function calls', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced();
      debounced();
      debounced();

      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('throttle', () => {
    it('should throttle function calls', () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100);

      throttled(); // Call 1 (executes)
      throttled(); // Call 2 (ignored)
      throttled(); // Call 3 (ignored)

      expect(fn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);

      throttled(); // Call 4 (executes)
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('debounceLeading', () => {
    it('should execute immediately then debounce', () => {
      const fn = vi.fn();
      const debounced = debounceLeading(fn, 100);

      debounced(); // Executes immediately
      expect(fn).toHaveBeenCalledTimes(1);

      debounced(); // Ignored
      debounced(); // Ignored

      vi.advanceTimersByTime(100);

      debounced(); // Executes again
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('throttleTrailing', () => {
    it('should execute immediately and then trailing', () => {
      const fn = vi.fn();
      const throttled = throttleTrailing(fn, 100);

      throttled('a'); // Executes immediately
      expect(fn).toHaveBeenCalledWith('a');

      throttled('b'); // Scheduled
      throttled('c'); // Overwrites 'b'

      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledWith('c');
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('memoize', () => {
    it('should memoize results', () => {
      const fn = vi.fn((...args: unknown[]) => (args[0] as number) * 2);
      const memoized = memoize(fn);

      expect(memoized(2)).toBe(4);
      expect(memoized(2)).toBe(4);
      expect(fn).toHaveBeenCalledTimes(1);

      expect(memoized(3)).toBe(6);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should use custom resolver', () => {
      const fn = vi.fn((...args: unknown[]) => (args[0] as { id: number }).id);
      const memoized = memoize(fn, (...args) =>
        String((args[0] as { id: number }).id)
      );

      const obj1 = { id: 1 };
      const obj2 = { id: 1 }; // Different object, same ID

      expect(memoized(obj1)).toBe(1);
      expect(memoized(obj2)).toBe(1);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });
});
