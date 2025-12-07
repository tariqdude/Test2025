import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sleep, retry, withTimeout, parallelLimit } from './async';

describe('Async Utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('sleep', () => {
    it('should wait for specified time', async () => {
      const promise = sleep(1000);
      vi.advanceTimersByTime(1000);
      await expect(promise).resolves.toBeUndefined();
    });
  });

  describe('retry', () => {
    it('should return result on success', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const result = await retry(fn);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('success');

      const promise = retry(fn, 3, 100);

      // Advance timers for backoff
      // 1st retry: 100ms
      await vi.advanceTimersByTimeAsync(100);

      const result = await promise;
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should throw after max attempts', async () => {
      const fn = vi
        .fn()
        .mockImplementation(() => Promise.reject(new Error('fail')));
      const promise = retry(fn, 3, 100);

      const expectation = expect(promise).rejects.toThrow('fail');

      // 1st retry: 100ms
      await vi.advanceTimersByTimeAsync(100);
      // 2nd retry: 200ms
      await vi.advanceTimersByTimeAsync(200);

      await expectation;
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe('withTimeout', () => {
    it('should resolve if promise completes before timeout', async () => {
      const promise = Promise.resolve('success');
      const result = await withTimeout(promise, 1000);
      expect(result).toBe('success');
    });

    it('should reject if promise times out', async () => {
      const promise = new Promise(resolve => setTimeout(resolve, 2000));
      const timeoutPromise = withTimeout(promise, 1000);

      vi.advanceTimersByTime(1000);

      await expect(timeoutPromise).rejects.toThrow('Operation timed out');
    });
  });

  describe('parallelLimit', () => {
    it('should limit concurrency', async () => {
      const items = [1, 2, 3, 4, 5];
      let active = 0;
      let maxActive = 0;

      const fn = async (item: number) => {
        active++;
        maxActive = Math.max(maxActive, active);
        await sleep(100);
        active--;
        return item * 2;
      };

      const promise = parallelLimit(items, 2, fn);

      // Advance time to let tasks complete
      await vi.advanceTimersByTimeAsync(100); // 1, 2 done
      await vi.advanceTimersByTimeAsync(100); // 3, 4 done
      await vi.advanceTimersByTimeAsync(100); // 5 done

      const results = await promise;

      expect(results).toEqual([2, 4, 6, 8, 10]);
      expect(maxActive).toBeLessThanOrEqual(2);
    });
  });
});
