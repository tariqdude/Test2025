/**
 * Array utility functions
 */

/**
 * Group array items by a key or function
 */
export function groupBy<T, K extends string | number | symbol>(
  array: T[],
  iteratee: keyof T | ((item: T) => K)
): Record<K, T[]> {
  return array.reduce(
    (acc, item) => {
      const key =
        typeof iteratee === 'function'
          ? (iteratee as (item: T) => K)(item)
          : (item[iteratee as keyof T] as unknown as K);
      (acc[key] = acc[key] || []).push(item);
      return acc;
    },
    {} as Record<K, T[]>
  );
}

/**
 * Sort array by key
 */
export function sortBy<T>(
  array: T[],
  key: keyof T,
  direction: 'asc' | 'desc' = 'asc'
): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];

    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * Remove duplicates from array using Set
 */
export function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

/**
 * Chunk array into smaller arrays
 */
export function chunk<T>(array: T[], size: number): T[][] {
  if (size <= 0) throw new Error('Chunk size must be positive');
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Flatten nested arrays to specified depth
 */
export function flatten<T>(array: unknown[], depth = 1): T[] {
  if (depth <= 0) return array as T[];
  return array.reduce<T[]>((acc, item) => {
    if (Array.isArray(item)) {
      acc.push(...flatten<T>(item, depth - 1));
    } else {
      acc.push(item as T);
    }
    return acc;
  }, []);
}

/**
 * Get intersection of two arrays
 */
export function intersection<T>(a: T[], b: T[]): T[] {
  const setB = new Set(b);
  return [...new Set(a)].filter(item => setB.has(item));
}

/**
 * Get difference of two arrays (items in a but not in b)
 */
export function difference<T>(a: T[], b: T[]): T[] {
  const setB = new Set(b);
  return a.filter(item => !setB.has(item));
}

/**
 * Get union of two arrays (unique items from both)
 */
export function union<T>(a: T[], b: T[]): T[] {
  return [...new Set([...a, ...b])];
}

/**
 * Partition array into two arrays based on predicate
 */
export function partition<T>(
  array: T[],
  predicate: (item: T, index: number) => boolean
): [T[], T[]] {
  const truthy: T[] = [];
  const falsy: T[] = [];

  array.forEach((item, index) => {
    if (predicate(item, index)) {
      truthy.push(item);
    } else {
      falsy.push(item);
    }
  });

  return [truthy, falsy];
}

/**
 * Find the first item matching predicate and return it with its index
 */
export function findWithIndex<T>(
  array: T[],
  predicate: (item: T, index: number) => boolean
): { item: T; index: number } | null {
  for (let i = 0; i < array.length; i++) {
    if (predicate(array[i], i)) {
      return { item: array[i], index: i };
    }
  }
  return null;
}

/**
 * Get the last item in an array
 */
export function last<T>(array: T[]): T | undefined {
  return array[array.length - 1];
}

/**
 * Get the first item in an array
 */
export function first<T>(array: T[]): T | undefined {
  return array[0];
}

/**
 * Take n items from start of array
 */
export function take<T>(array: T[], n: number): T[] {
  return array.slice(0, Math.max(0, n));
}

/**
 * Drop n items from start of array
 */
export function drop<T>(array: T[], n: number): T[] {
  return array.slice(Math.max(0, n));
}

/**
 * Create array from range (start to end, exclusive)
 */
export function range(start: number, end?: number, step = 1): number[] {
  if (end === undefined) {
    end = start;
    start = 0;
  }

  const result: number[] = [];
  if (step > 0) {
    for (let i = start; i < end; i += step) {
      result.push(i);
    }
  } else if (step < 0) {
    for (let i = start; i > end; i += step) {
      result.push(i);
    }
  }

  return result;
}

/**
 * Remove duplicates by key
 */
export function uniqueBy<T, K>(array: T[], keyFn: (item: T) => K): T[] {
  const seen = new Set<K>();
  return array.filter(item => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Count items matching predicate
 */
export function countBy<T>(
  array: T[],
  predicate: (item: T) => boolean
): number {
  return array.reduce((count, item) => count + (predicate(item) ? 1 : 0), 0);
}

/**
 * Sum of array numbers
 */
export function sum(array: number[]): number {
  return array.reduce((acc, val) => acc + val, 0);
}

/**
 * Average of array numbers
 */
export function average(array: number[]): number {
  if (array.length === 0) return 0;
  return sum(array) / array.length;
}

/**
 * Find min value in array (or by key)
 */
export function minBy<T>(
  array: T[],
  keyFn: (item: T) => number
): T | undefined {
  if (array.length === 0) return undefined;
  return array.reduce((min, item) => (keyFn(item) < keyFn(min) ? item : min));
}

/**
 * Find max value in array (or by key)
 */
export function maxBy<T>(
  array: T[],
  keyFn: (item: T) => number
): T | undefined {
  if (array.length === 0) return undefined;
  return array.reduce((max, item) => (keyFn(item) > keyFn(max) ? item : max));
}

/**
 * Zip multiple arrays together
 */
export function zip<T>(...arrays: T[][]): T[][] {
  const maxLength = Math.max(...arrays.map(arr => arr.length));
  const result: T[][] = [];

  for (let i = 0; i < maxLength; i++) {
    result.push(arrays.map(arr => arr[i]));
  }

  return result;
}

/**
 * Create an object from array using key extractor
 */
export function keyBy<T, K extends string | number | symbol>(
  array: T[],
  keyFn: (item: T) => K
): Record<K, T> {
  return array.reduce(
    (acc, item) => {
      acc[keyFn(item)] = item;
      return acc;
    },
    {} as Record<K, T>
  );
}

/**
 * Sample random items from array
 */
export function sample<T>(array: T[], n = 1): T[] {
  const shuffled = shuffle(array);
  return shuffled.slice(0, Math.min(n, array.length));
}

/**
 * Compact array (remove null/undefined/false values)
 */
export function compact<T>(array: (T | null | undefined | false)[]): T[] {
  return array.filter((item): item is T => Boolean(item));
}
