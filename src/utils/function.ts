/**
 * Function utilities for performance optimization and control flow
 */

/**
 * Debounce function calls
 * Ensures a function is only called once after a specified delay
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function calls
 * Ensures a function is called at most once every specified limit
 */
export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Debounce with leading edge (call immediately, then debounce)
 */
export const debounceLeading = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null;
  let lastCallTime = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();

    if (now - lastCallTime >= wait) {
      func(...args);
      lastCallTime = now;
    }

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      timeout = null;
    }, wait);
  };
};

/**
 * Throttle with trailing edge
 */
export const throttleTrailing = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let lastArgs: Parameters<T> | null = null;
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    lastArgs = args;

    if (!timeout) {
      func(...args);
      lastArgs = null;

      timeout = setTimeout(() => {
        if (lastArgs) {
          func(...lastArgs);
        }
        timeout = null;
      }, limit);
    }
  };
};

/**
 * Memoize function results
 */
export const memoize = <T extends (...args: unknown[]) => unknown>(
  func: T,
  resolver?: (...args: Parameters<T>) => string
): T => {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = resolver ? resolver(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = func(...args) as ReturnType<T>;
    cache.set(key, result);
    return result;
  }) as T;
};

/**
 * Memoize with LRU cache
 */
export const memoizeLRU = <T extends (...args: unknown[]) => unknown>(
  func: T,
  maxSize: number,
  resolver?: (...args: Parameters<T>) => string
): T => {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = resolver ? resolver(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      const value = cache.get(key)!;
      // Move to end (most recently used)
      cache.delete(key);
      cache.set(key, value);
      return value;
    }

    const result = func(...args) as ReturnType<T>;
    cache.set(key, result);

    // Remove oldest if over limit
    if (cache.size > maxSize) {
      const firstKey = cache.keys().next().value as string | undefined;
      if (firstKey !== undefined) {
        cache.delete(firstKey);
      }
    }

    return result;
  }) as T;
};

/**
 * Call function only once
 */
export const once = <T extends (...args: unknown[]) => unknown>(func: T): T => {
  let called = false;
  let result: ReturnType<T>;

  return ((...args: Parameters<T>): ReturnType<T> => {
    if (!called) {
      called = true;
      result = func(...args) as ReturnType<T>;
    }
    return result;
  }) as T;
};

/**
 * Negate a predicate function
 */
export const negate = <T extends (...args: unknown[]) => boolean>(
  predicate: T
): ((...args: Parameters<T>) => boolean) => {
  return (...args: Parameters<T>) => !predicate(...args);
};

/**
 * Compose functions (right to left)
 */
export const compose = <T>(...fns: ((arg: T) => T)[]): ((arg: T) => T) => {
  return (arg: T) => fns.reduceRight((acc, fn) => fn(acc), arg);
};

/**
 * Pipe functions (left to right)
 */
export const pipe = <T>(...fns: ((arg: T) => T)[]): ((arg: T) => T) => {
  return (arg: T) => fns.reduce((acc, fn) => fn(acc), arg);
};

/**
 * Curry a function
 */
export const curry = <T extends (...args: unknown[]) => unknown>(
  func: T,
  arity = func.length
): ((...args: unknown[]) => unknown) => {
  return function curried(...args: unknown[]): unknown {
    if (args.length >= arity) {
      return func(...args);
    }
    return (...moreArgs: unknown[]) => curried(...args, ...moreArgs);
  };
};

/**
 * Partial application
 */
export const partial = <T extends (...args: unknown[]) => unknown>(
  func: T,
  ...partialArgs: unknown[]
): ((...args: unknown[]) => ReturnType<T>) => {
  return (...args: unknown[]) => func(...partialArgs, ...args) as ReturnType<T>;
};

/**
 * Call function after n invocations
 */
export const after = <T extends (...args: unknown[]) => unknown>(
  n: number,
  func: T
): ((...args: Parameters<T>) => ReturnType<T> | undefined) => {
  let count = 0;

  return (...args: Parameters<T>) => {
    count++;
    if (count >= n) {
      return func(...args) as ReturnType<T>;
    }
    return undefined;
  };
};

/**
 * Call function before n invocations
 */
export const before = <T extends (...args: unknown[]) => unknown>(
  n: number,
  func: T
): ((...args: Parameters<T>) => ReturnType<T> | undefined) => {
  let count = 0;
  let result: ReturnType<T>;

  return (...args: Parameters<T>) => {
    count++;
    if (count < n) {
      result = func(...args) as ReturnType<T>;
    }
    return result;
  };
};

/**
 * Rate limit function calls
 */
export const rateLimit = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number,
  interval: number
): ((...args: Parameters<T>) => ReturnType<T> | undefined) => {
  const calls: number[] = [];

  return (...args: Parameters<T>) => {
    const now = Date.now();

    // Remove old calls outside the interval
    while (calls.length > 0 && now - calls[0] >= interval) {
      calls.shift();
    }

    if (calls.length < limit) {
      calls.push(now);
      return func(...args) as ReturnType<T>;
    }

    return undefined;
  };
};

/**
 * Delay function execution
 */
export const delay = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
  ...args: Parameters<T>
): Promise<ReturnType<T>> => {
  return new Promise(resolve => {
    setTimeout(() => resolve(func(...args) as ReturnType<T>), wait);
  });
};

/**
 * Wrap function with try-catch
 */
export const tryCatch = <T extends (...args: unknown[]) => unknown>(
  func: T,
  onError?: (error: Error, ...args: Parameters<T>) => ReturnType<T>
): ((...args: Parameters<T>) => ReturnType<T> | undefined) => {
  return (...args: Parameters<T>) => {
    try {
      return func(...args) as ReturnType<T>;
    } catch (error) {
      if (onError) {
        return onError(
          error instanceof Error ? error : new Error(String(error)),
          ...args
        );
      }
      return undefined;
    }
  };
};

/**
 * Create a no-operation function
 */
export const noop = (): void => {};

/**
 * Identity function
 */
export const identity = <T>(value: T): T => value;

/**
 * Constant function
 */
export const constant =
  <T>(value: T): (() => T) =>
  () =>
    value;

/**
 * Times - call function n times
 */
export const times = <T>(n: number, iteratee: (index: number) => T): T[] => {
  const result: T[] = [];
  for (let i = 0; i < n; i++) {
    result.push(iteratee(i));
  }
  return result;
};
