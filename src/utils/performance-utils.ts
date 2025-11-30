/**
 * Performance utilities
 */

import { logger } from './logger';

/**
 * Measure function execution time
 */
export const measureTime = async <T>(
  fn: () => Promise<T> | T,
  label?: string
): Promise<{ result: T; duration: number }> => {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;

  if (label) {
    logger.debug('Function timing captured', {
      label,
      duration: Number(duration.toFixed(2)),
    });
  }

  return { result, duration };
};
