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
