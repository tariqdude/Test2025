/**
 * Async utilities
 */

/**
 * Sleep utility for async operations
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry function with exponential backoff
 */
export const retry = async <T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delay = 1000
): Promise<T> => {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxAttempts) {
        throw lastError;
      }

      await sleep(delay * Math.pow(2, attempt - 1));
    }
  }

  // This should never be reached due to the throw above, but TypeScript needs it
  throw lastError || new Error('Unknown error in retry function');
};

/**
 * Timeout wrapper for async operations
 */
export const withTimeout = <T>(
  promise: Promise<T>,
  ms: number,
  errorMessage = 'Operation timed out'
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(errorMessage));
    }, ms);

    promise
      .then(result => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch(error => {
        clearTimeout(timer);
        reject(error);
      });
  });
};

/**
 * Execute promises in parallel with a concurrency limit
 */
export const parallelLimit = async <T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> => {
  const results: R[] = [];
  const executing: Promise<void>[] = [];
  let index = 0;

  for (const item of items) {
    const currentIndex = index++;
    const promise = fn(item, currentIndex).then(result => {
      results[currentIndex] = result;
    });

    executing.push(promise as unknown as Promise<void>);

    if (executing.length >= limit) {
      await Promise.race(executing);
      executing.splice(
        executing.findIndex(p => p === promise),
        1
      );
    }
  }

  await Promise.all(executing);
  return results;
};

/**
 * Execute promises sequentially
 */
export const sequential = async <T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> => {
  const results: R[] = [];
  for (let i = 0; i < items.length; i++) {
    results.push(await fn(items[i], i));
  }
  return results;
};

/**
 * Delay execution until condition is met
 */
export const waitUntil = async (
  condition: () => boolean | Promise<boolean>,
  interval = 100,
  timeout = 10000
): Promise<void> => {
  const startTime = Date.now();

  while (!(await condition())) {
    if (Date.now() - startTime >= timeout) {
      throw new Error('waitUntil timeout exceeded');
    }
    await sleep(interval);
  }
};

/**
 * Memoize async function results with optional TTL
 */
export const memoizeAsync = <T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  options: {
    ttl?: number;
    keyFn?: (...args: T) => string;
  } = {}
): ((...args: T) => Promise<R>) => {
  const cache = new Map<string, { value: R; timestamp: number }>();
  const { ttl, keyFn = (...args: T) => JSON.stringify(args) } = options;

  return async (...args: T): Promise<R> => {
    const key = keyFn(...args);
    const cached = cache.get(key);

    if (cached) {
      if (!ttl || Date.now() - cached.timestamp < ttl) {
        return cached.value;
      }
      cache.delete(key);
    }

    const result = await fn(...args);
    cache.set(key, { value: result, timestamp: Date.now() });
    return result;
  };
};

/**
 * Promise pool for managing concurrent executions
 */
export class PromisePool<T> {
  private queue: (() => Promise<T>)[] = [];
  private running = 0;
  private results: T[] = [];

  constructor(private concurrency: number) {}

  add(task: () => Promise<T>): this {
    this.queue.push(task);
    return this;
  }

  async run(): Promise<T[]> {
    return new Promise((resolve, reject) => {
      let completed = 0;
      const total = this.queue.length;

      if (total === 0) {
        resolve([]);
        return;
      }

      const executeNext = () => {
        while (this.running < this.concurrency && this.queue.length > 0) {
          const task = this.queue.shift()!;
          this.running++;

          task()
            .then(result => {
              this.results.push(result);
              completed++;
              this.running--;

              if (completed === total) {
                resolve(this.results);
              } else {
                executeNext();
              }
            })
            .catch(reject);
        }
      };

      executeNext();
    });
  }
}

/**
 * Defer execution to next tick
 */
export const defer = <T>(fn: () => T): Promise<T> => {
  return new Promise(resolve => {
    setTimeout(() => resolve(fn()), 0);
  });
};

/**
 * Create a deferred promise
 */
export interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
}

export const createDeferred = <T>(): Deferred<T> => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};

/**
 * Race with error handling - first successful promise wins
 */
export const raceSuccess = async <T>(promises: Promise<T>[]): Promise<T> => {
  return new Promise((resolve, reject) => {
    const errors: Error[] = [];
    let rejected = 0;

    promises.forEach(promise => {
      promise.then(resolve).catch(error => {
        errors.push(error);
        rejected++;
        if (rejected === promises.length) {
          reject(new AggregateError(errors, 'All promises rejected'));
        }
      });
    });
  });
};

/**
 * Retry with custom backoff strategy
 */
export type BackoffStrategy = (attempt: number) => number;

export const backoffStrategies = {
  constant:
    (delay: number): BackoffStrategy =>
    () =>
      delay,
  linear:
    (baseDelay: number): BackoffStrategy =>
    attempt =>
      baseDelay * attempt,
  exponential:
    (baseDelay: number): BackoffStrategy =>
    attempt =>
      baseDelay * Math.pow(2, attempt - 1),
  fibonacci: (baseDelay: number): BackoffStrategy => {
    const fib = (n: number): number => (n <= 1 ? n : fib(n - 1) + fib(n - 2));
    return attempt => baseDelay * fib(attempt);
  },
};

export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    backoff?: BackoffStrategy;
    onRetry?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> => {
  const {
    maxAttempts = 3,
    backoff = backoffStrategies.exponential(1000),
    onRetry,
  } = options;

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxAttempts) {
        throw lastError;
      }

      onRetry?.(lastError, attempt);
      await sleep(backoff(attempt));
    }
  }

  throw lastError || new Error('Unknown error in retryWithBackoff');
};
