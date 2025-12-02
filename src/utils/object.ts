/**
 * Object utilities
 */

/**
 * Type guard for objects
 */
const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

/**
 * Deep merge objects with proper type safety
 */
export const deepMerge = <T extends Record<string, unknown>>(
  target: T,
  ...sources: Partial<T>[]
): T => {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(
          target[key] as Record<string, unknown>,
          source[key] as Record<string, unknown>
        );
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return deepMerge(target, ...sources);
};

/**
 * Pick specific keys from object
 */
export const pick = <T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
};

/**
 * Omit specific keys from object
 */
export const omit = <T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> => {
  const result = { ...obj } as Omit<T, K>;
  keys.forEach(key => {
    delete (result as Record<string, unknown>)[key as string];
  });
  return result;
};

/**
 * Deep clone an object
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }

  if (obj instanceof RegExp) {
    return new RegExp(obj.source, obj.flags) as unknown as T;
  }

  if (obj instanceof Map) {
    return new Map(
      Array.from(obj.entries()).map(([k, v]) => [deepClone(k), deepClone(v)])
    ) as unknown as T;
  }

  if (obj instanceof Set) {
    return new Set(Array.from(obj).map(v => deepClone(v))) as unknown as T;
  }

  const cloned = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
};

/**
 * Deep freeze an object (make it immutable)
 */
export const deepFreeze = <T extends Record<string, unknown>>(
  obj: T
): Readonly<T> => {
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    if (
      typeof value === 'object' &&
      value !== null &&
      !Object.isFrozen(value)
    ) {
      deepFreeze(value as Record<string, unknown>);
    }
  });
  return Object.freeze(obj);
};

/**
 * Check if two values are deeply equal
 */
export const deepEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;

  if (typeof a !== typeof b) return false;

  if (a === null || b === null) return a === b;

  if (typeof a !== 'object') return false;

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }

  const keysA = Object.keys(a as object);
  const keysB = Object.keys(b as object);

  if (keysA.length !== keysB.length) return false;

  return keysA.every(
    key =>
      Object.prototype.hasOwnProperty.call(b, key) &&
      deepEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key]
      )
  );
};

/**
 * Flatten nested object keys with dot notation
 */
export const flattenObject = (
  obj: Record<string, unknown>,
  prefix = ''
): Record<string, unknown> => {
  const result: Record<string, unknown> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];

      if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
      ) {
        Object.assign(
          result,
          flattenObject(value as Record<string, unknown>, newKey)
        );
      } else {
        result[newKey] = value;
      }
    }
  }

  return result;
};

/**
 * Unflatten dot-notation keys back to nested object
 */
export const unflattenObject = (
  obj: Record<string, unknown>
): Record<string, unknown> => {
  const result: Record<string, unknown> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const keys = key.split('.');
      let current = result;

      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (!(k in current)) {
          current[k] = {};
        }
        current = current[k] as Record<string, unknown>;
      }

      current[keys[keys.length - 1]] = obj[key];
    }
  }

  return result;
};

/**
 * Get value from nested object using dot notation path
 */
export const getByPath = <T = unknown>(
  obj: Record<string, unknown>,
  path: string,
  defaultValue?: T
): T | undefined => {
  const keys = path.split('.');
  let result: unknown = obj;

  for (const key of keys) {
    if (result === null || result === undefined) {
      return defaultValue;
    }
    result = (result as Record<string, unknown>)[key];
  }

  return (result as T) ?? defaultValue;
};

/**
 * Set value in nested object using dot notation path
 */
export const setByPath = (
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): void => {
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }

  current[keys[keys.length - 1]] = value;
};

/**
 * Delete value from nested object using dot notation path
 */
export const deleteByPath = (
  obj: Record<string, unknown>,
  path: string
): boolean => {
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current)) {
      return false;
    }
    current = current[key] as Record<string, unknown>;
  }

  const lastKey = keys[keys.length - 1];
  if (lastKey in current) {
    delete current[lastKey];
    return true;
  }
  return false;
};

/**
 * Map over object values
 */
export const mapValues = <T, U>(
  obj: Record<string, T>,
  fn: (value: T, key: string) => U
): Record<string, U> => {
  const result: Record<string, U> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = fn(obj[key], key);
    }
  }
  return result;
};

/**
 * Map over object keys
 */
export const mapKeys = <T>(
  obj: Record<string, T>,
  fn: (key: string, value: T) => string
): Record<string, T> => {
  const result: Record<string, T> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[fn(key, obj[key])] = obj[key];
    }
  }
  return result;
};

/**
 * Filter object by predicate
 */
export const filterObject = <T>(
  obj: Record<string, T>,
  predicate: (value: T, key: string) => boolean
): Record<string, T> => {
  const result: Record<string, T> = {};
  for (const key in obj) {
    if (
      Object.prototype.hasOwnProperty.call(obj, key) &&
      predicate(obj[key], key)
    ) {
      result[key] = obj[key];
    }
  }
  return result;
};

/**
 * Invert object keys and values
 */
export const invert = <T extends string | number | symbol>(
  obj: Record<string, T>
): Record<T, string> => {
  const result = {} as Record<T, string>;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[obj[key]] = key;
    }
  }
  return result;
};

/**
 * Check if object has a specific path
 */
export const hasPath = (
  obj: Record<string, unknown>,
  path: string
): boolean => {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (
      current === null ||
      current === undefined ||
      typeof current !== 'object'
    ) {
      return false;
    }
    if (!(key in current)) {
      return false;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return true;
};

/**
 * Create object from entries with type safety
 */
export const fromEntries = <K extends string | number | symbol, V>(
  entries: [K, V][]
): Record<K, V> => {
  return Object.fromEntries(entries) as Record<K, V>;
};

/**
 * Get typed entries from object
 */
export const entries = <K extends string, V>(obj: Record<K, V>): [K, V][] => {
  return Object.entries(obj) as [K, V][];
};

/**
 * Get typed keys from object
 */
export const keys = <K extends string>(obj: Record<K, unknown>): K[] => {
  return Object.keys(obj) as K[];
};

/**
 * Get typed values from object
 */
export const values = <V>(obj: Record<string, V>): V[] => {
  return Object.values(obj);
};
