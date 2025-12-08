/**
 * Resilience Utilities Tests
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  CircuitBreaker,
  CircuitBreakerOpenError,
  withCircuitBreaker,
  retry,
  withRetry,
  RetryError,
  AbortError,
  RateLimiter,
  RateLimitExceededError,
  withRateLimit,
  Bulkhead,
  BulkheadFullError,
  withBulkhead,
  withTimeout,
  timeout,
  TimeoutError,
  withFallback,
  fallback,
  hedge,
  resilient,
  createHealthCheck,
} from '../utils/resilience';

describe('Resilience Utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('CircuitBreaker', () => {
    it('should start in closed state', () => {
      const fn = vi.fn().mockResolvedValue('ok');
      const cb = new CircuitBreaker(fn, {
        failureThreshold: 3,
        recoveryTimeout: 1000,
      });

      expect(cb.getState()).toBe('closed');
    });

    it('should execute function in closed state', async () => {
      const fn = vi.fn().mockResolvedValue('result');
      const cb = new CircuitBreaker(fn, {
        failureThreshold: 3,
        recoveryTimeout: 1000,
      });

      const result = await cb.execute('arg');
      expect(result).toBe('result');
      expect(fn).toHaveBeenCalledWith('arg');
    });

    it('should open after failure threshold', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('fail'));
      const cb = new CircuitBreaker(fn, {
        failureThreshold: 2,
        recoveryTimeout: 1000,
      });

      await expect(cb.execute()).rejects.toThrow();
      await expect(cb.execute()).rejects.toThrow();

      expect(cb.getState()).toBe('open');
    });

    it('should reject immediately when open', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('fail'));
      const cb = new CircuitBreaker(fn, {
        failureThreshold: 1,
        recoveryTimeout: 1000,
      });

      await expect(cb.execute()).rejects.toThrow();
      await expect(cb.execute()).rejects.toThrow(CircuitBreakerOpenError);
    });

    it('should transition to half-open after recovery timeout', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('fail'));
      const cb = new CircuitBreaker(fn, {
        failureThreshold: 1,
        recoveryTimeout: 1000,
      });

      await expect(cb.execute()).rejects.toThrow();
      expect(cb.getState()).toBe('open');

      vi.advanceTimersByTime(1000);

      fn.mockResolvedValue('ok');
      await cb.execute();

      expect(cb.getState()).toBe('closed');
    });

    it('should reset circuit', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('fail'));
      const cb = new CircuitBreaker(fn, {
        failureThreshold: 1,
        recoveryTimeout: 1000,
      });

      await expect(cb.execute()).rejects.toThrow();
      cb.reset();

      expect(cb.getState()).toBe('closed');
      expect(cb.getFailureCount()).toBe(0);
    });

    it('should call onStateChange', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('fail'));
      const onStateChange = vi.fn();
      const cb = new CircuitBreaker(fn, {
        failureThreshold: 1,
        recoveryTimeout: 1000,
        onStateChange,
      });

      await expect(cb.execute()).rejects.toThrow();

      expect(onStateChange).toHaveBeenCalledWith('closed', 'open');
    });

    it('should respect custom isFailure', async () => {
      const fn = vi.fn().mockRejectedValue({ code: 'RETRY' });
      const cb = new CircuitBreaker(fn, {
        failureThreshold: 1,
        recoveryTimeout: 1000,
        isFailure: (err: unknown) =>
          (err as { code?: string }).code !== 'RETRY',
      });

      await expect(cb.execute()).rejects.toMatchObject({ code: 'RETRY' });
      expect(cb.getState()).toBe('closed');
    });
  });

  describe('withCircuitBreaker', () => {
    it('should create circuit breaker wrapper', async () => {
      const fn = vi.fn().mockResolvedValue('result');
      const cb = withCircuitBreaker(fn, {
        failureThreshold: 3,
        recoveryTimeout: 1000,
      });

      const result = await cb.execute('arg');
      expect(result).toBe('result');
    });
  });

  describe('retry', () => {
    it('should succeed on first try', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const result = await retry(fn, { maxAttempts: 3, baseDelay: 100 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail1'))
        .mockRejectedValueOnce(new Error('fail2'))
        .mockResolvedValue('success');

      const promise = retry(fn, { maxAttempts: 3, baseDelay: 100 });

      await vi.runAllTimersAsync();

      expect(await promise).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw RetryError after max attempts', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('fail'));

      const promise = retry(fn, { maxAttempts: 2, baseDelay: 100 });
      const expectPromise = expect(promise).rejects.toThrow(RetryError);
      await vi.runAllTimersAsync();

      await expectPromise;
    });

    it('should call onRetry callback', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('ok');
      const onRetry = vi.fn();

      const promise = retry(fn, { maxAttempts: 3, baseDelay: 100, onRetry });
      await vi.runAllTimersAsync();
      await promise;

      expect(onRetry).toHaveBeenCalledWith(
        expect.any(Error),
        1,
        expect.any(Number)
      );
    });

    it('should respect abort signal', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('fail'));
      const controller = new AbortController();

      const promise = retry(fn, {
        maxAttempts: 5,
        baseDelay: 100,
        signal: controller.signal,
      });

      const expectPromise = expect(promise).rejects.toThrow(AbortError);
      controller.abort();
      await vi.runAllTimersAsync();

      await expectPromise;
    });

    it('should use exponential backoff', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('ok');
      const onRetry = vi.fn();

      const promise = retry(fn, {
        maxAttempts: 3,
        baseDelay: 100,
        backoff: 'exponential',
        onRetry,
      });
      await vi.runAllTimersAsync();
      await promise;

      // First retry: 100ms, second: 200ms
      expect(onRetry).toHaveBeenNthCalledWith(1, expect.any(Error), 1, 100);
      expect(onRetry).toHaveBeenNthCalledWith(2, expect.any(Error), 2, 200);
    });

    it('should respect maxDelay', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('ok');
      const onRetry = vi.fn();

      const promise = retry(fn, {
        maxAttempts: 3,
        baseDelay: 100,
        maxDelay: 150,
        backoff: 'exponential',
        onRetry,
      });
      await vi.runAllTimersAsync();
      await promise;

      expect(onRetry).toHaveBeenNthCalledWith(2, expect.any(Error), 2, 150);
    });

    it('should respect isRetryable', async () => {
      const fn = vi.fn().mockRejectedValue({ code: 'PERMANENT' });

      const promise = retry(fn, {
        maxAttempts: 3,
        baseDelay: 100,
        isRetryable: err => (err as { code?: string }).code !== 'PERMANENT',
      });

      await expect(promise).rejects.toThrow(RetryError);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('withRetry', () => {
    it('should create retryable function', async () => {
      const fn = vi.fn().mockResolvedValue('result');
      const retryable = withRetry(fn, { maxAttempts: 3, baseDelay: 100 });

      const result = await retryable('arg');
      expect(result).toBe('result');
    });
  });

  describe('RateLimiter', () => {
    it('should allow requests within limit', async () => {
      const limiter = new RateLimiter({ maxRequests: 2, interval: 1000 });

      expect(limiter.tryAcquire()).toBe(true);
      expect(limiter.tryAcquire()).toBe(true);
      expect(limiter.tryAcquire()).toBe(false);
    });

    it('should refill tokens over time', async () => {
      const limiter = new RateLimiter({ maxRequests: 2, interval: 1000 });

      limiter.tryAcquire();
      limiter.tryAcquire();

      vi.advanceTimersByTime(1000);

      expect(limiter.tryAcquire()).toBe(true);
    });

    it('should throw when exceeding rate without queue', async () => {
      const limiter = new RateLimiter({
        maxRequests: 1,
        interval: 1000,
        queueExcess: false,
      });

      await limiter.acquire();
      await expect(limiter.acquire()).rejects.toThrow(RateLimitExceededError);
    });

    it('should queue excess requests', async () => {
      const limiter = new RateLimiter({
        maxRequests: 1,
        interval: 1000,
        queueExcess: true,
      });

      await limiter.acquire();

      const secondAcquire = limiter.acquire();
      expect(limiter.getQueueSize()).toBe(1);

      vi.advanceTimersByTime(1000);
      await secondAcquire;

      expect(limiter.getQueueSize()).toBe(0);
    });

    it('should execute with rate limiting', async () => {
      const limiter = new RateLimiter({ maxRequests: 10, interval: 1000 });
      const fn = vi.fn().mockResolvedValue('result');

      const result = await limiter.execute(fn);
      expect(result).toBe('result');
    });

    it('should report available tokens', () => {
      const limiter = new RateLimiter({ maxRequests: 3, interval: 1000 });

      expect(limiter.getAvailableTokens()).toBe(3);
      limiter.tryAcquire();
      expect(limiter.getAvailableTokens()).toBe(2);
    });

    it('should reset limiter', () => {
      const limiter = new RateLimiter({ maxRequests: 2, interval: 1000 });

      limiter.tryAcquire();
      limiter.tryAcquire();
      limiter.reset();

      expect(limiter.getAvailableTokens()).toBe(2);
    });
  });

  describe('withRateLimit', () => {
    it('should create rate-limited function', async () => {
      const fn = vi.fn().mockResolvedValue('result');
      const limited = withRateLimit(fn, { maxRequests: 10, interval: 1000 });

      const result = await limited('arg');
      expect(result).toBe('result');
    });
  });

  describe('Bulkhead', () => {
    it('should limit concurrent executions', async () => {
      const bulkhead = new Bulkhead({ maxConcurrent: 2 });
      let running = 0;
      let maxRunning = 0;

      const fn = async () => {
        running++;
        maxRunning = Math.max(maxRunning, running);
        await new Promise(r => setTimeout(r, 100));
        running--;
        return 'done';
      };

      const promises = [
        bulkhead.execute(fn),
        bulkhead.execute(fn),
        bulkhead.execute(fn),
      ];

      vi.advanceTimersByTime(50);
      expect(bulkhead.getRunning()).toBe(2);
      expect(bulkhead.getQueueSize()).toBe(1);

      await vi.runAllTimersAsync();
      await Promise.all(promises);

      expect(maxRunning).toBe(2);
    });

    it('should throw when queue is full', async () => {
      const bulkhead = new Bulkhead({ maxConcurrent: 1, maxQueue: 1 });

      const slowFn = () => new Promise(r => setTimeout(r, 1000));

      bulkhead.execute(slowFn);
      bulkhead.execute(slowFn);

      await expect(bulkhead.execute(slowFn)).rejects.toThrow(BulkheadFullError);
    });

    it('should report availability', () => {
      const bulkhead = new Bulkhead({ maxConcurrent: 1 });

      expect(bulkhead.isAvailable()).toBe(true);

      bulkhead.execute(() => new Promise(r => setTimeout(r, 1000)));

      expect(bulkhead.isAvailable()).toBe(false);
    });
  });

  describe('withBulkhead', () => {
    it('should create bulkhead-protected function', async () => {
      const fn = vi.fn().mockResolvedValue('result');
      const protected_fn = withBulkhead(fn, { maxConcurrent: 2 });

      const result = await protected_fn('arg');
      expect(result).toBe('result');
    });
  });

  describe('withTimeout', () => {
    it('should resolve before timeout', async () => {
      const fn = () => Promise.resolve('success');

      const result = await withTimeout(fn, 1000);
      expect(result).toBe('success');
    });

    it('should reject on timeout', async () => {
      const fn = () => new Promise(r => setTimeout(r, 2000));

      const promise = withTimeout(fn, 100);
      vi.advanceTimersByTime(100);

      await expect(promise).rejects.toThrow(TimeoutError);
    });
  });

  describe('timeout', () => {
    it('should create timeout-wrapped function', async () => {
      const fn = vi.fn().mockResolvedValue('result');
      const withTo = timeout(fn, 1000);

      const result = await withTo('arg');
      expect(result).toBe('result');
    });
  });

  describe('withFallback', () => {
    it('should return result on success', async () => {
      const fn = () => Promise.resolve('success');

      const result = await withFallback(fn, 'fallback');
      expect(result).toBe('success');
    });

    it('should return fallback value on error', async () => {
      const fn = () => Promise.reject(new Error('fail'));

      const result = await withFallback(fn, 'fallback');
      expect(result).toBe('fallback');
    });

    it('should call fallback function on error', async () => {
      const fn = () => Promise.reject(new Error('fail'));
      const fallbackFn = vi.fn().mockReturnValue('computed');

      const result = await withFallback(fn, fallbackFn);
      expect(result).toBe('computed');
      expect(fallbackFn).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('fallback', () => {
    it('should create function with fallback', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('fail'));
      const withFb = fallback(fn, 'default');

      const result = await withFb('arg');
      expect(result).toBe('default');
    });
  });

  describe('hedge', () => {
    it('should return first successful result', async () => {
      // Create a function where the first call resolves fastest
      const fn = vi
        .fn()
        .mockImplementationOnce(async () => {
          await new Promise(r => setTimeout(r, 10));
          return 'first';
        })
        .mockImplementationOnce(async () => {
          await new Promise(r => setTimeout(r, 100));
          return 'second';
        })
        .mockImplementationOnce(async () => {
          await new Promise(r => setTimeout(r, 200));
          return 'third';
        });

      const promise = hedge(fn, 3, 5);
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toBe('first');
    });
  });

  describe('resilient', () => {
    it('should compose multiple patterns', async () => {
      const fn = vi.fn().mockResolvedValue('result');
      const resilientFn = resilient(fn, {
        timeout: 1000,
        retry: { maxAttempts: 2, baseDelay: 100 },
      });

      const result = await resilientFn('arg');
      expect(result).toBe('result');
    });

    it('should apply patterns in correct order', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('success');

      const resilientFn = resilient(fn, {
        retry: { maxAttempts: 2, baseDelay: 100 },
      });

      const promise = resilientFn();
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toBe('success');
    });
  });

  describe('createHealthCheck', () => {
    it('should return healthy result on success', async () => {
      const check = vi.fn().mockResolvedValue(undefined);
      const healthCheck = createHealthCheck(check, 1000);

      const result = await healthCheck();

      expect(result.healthy).toBe(true);
      expect(result.latency).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    it('should return unhealthy result on failure', async () => {
      const check = vi.fn().mockRejectedValue(new Error('Service down'));
      const healthCheck = createHealthCheck(check, 1000);

      const result = await healthCheck();

      expect(result.healthy).toBe(false);
      expect(result.error).toBe('Service down');
    });

    it('should return unhealthy on timeout', async () => {
      const check = (): Promise<void> => new Promise(r => setTimeout(r, 2000));
      const healthCheck = createHealthCheck(check, 100);

      const promise = healthCheck();
      vi.advanceTimersByTime(100);
      const result = await promise;

      expect(result.healthy).toBe(false);
    });
  });
});
