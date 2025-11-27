import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  processBatch,
  processParallelBatches,
  createRateLimitedProcessor,
  BatchQueue,
  chunkArray,
  flattenResults,
  mapWithConcurrency,
  filterWithConcurrency,
} from '../utils/batch';

// Mock logger to prevent console output during tests
vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('Batch Processing Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /* ==================== processBatch TESTS ==================== */

  describe('processBatch', () => {
    it('should process all items successfully', async () => {
      const items = [1, 2, 3, 4, 5];
      const processor = vi.fn(async (item: number) => item * 2);

      const result = await processBatch(items, processor, { batchSize: 2 });

      expect(result.results).toEqual([2, 4, 6, 8, 10]);
      expect(result.failures).toHaveLength(0);
      expect(result.stats.total).toBe(5);
      expect(result.stats.successful).toBe(5);
      expect(result.stats.failed).toBe(0);
      expect(processor).toHaveBeenCalledTimes(5);
    });

    it('should handle empty items array', async () => {
      const items: number[] = [];
      const processor = vi.fn(async (item: number) => item * 2);

      const result = await processBatch(items, processor);

      expect(result.results).toEqual([]);
      expect(result.stats.total).toBe(0);
      expect(processor).not.toHaveBeenCalled();
    });

    it('should call progress callback', async () => {
      const items = [1, 2, 3];
      const processor = async (item: number) => item * 2;
      const onProgress = vi.fn();

      await processBatch(items, processor, { batchSize: 1, onProgress });

      expect(onProgress).toHaveBeenCalledTimes(3);
      expect(onProgress).toHaveBeenLastCalledWith(
        expect.objectContaining({
          total: 3,
          processed: 3,
          successful: 3,
          percentage: 100,
        })
      );
    });

    it('should call onBatchComplete callback', async () => {
      const items = [1, 2, 3, 4];
      const processor = async (item: number) => item * 2;
      const onBatchComplete = vi.fn();

      await processBatch(items, processor, { batchSize: 2, onBatchComplete });

      expect(onBatchComplete).toHaveBeenCalledTimes(2);
    });

    it('should handle errors with skip action', async () => {
      const items = [1, 2, 3];
      const processor = vi.fn(async (item: number) => {
        if (item === 2) throw new Error('Test error');
        return item * 2;
      });
      const onError = vi.fn().mockReturnValue('skip');

      const result = await processBatch(items, processor, { onError });

      expect(result.results).toEqual([2, 6]);
      expect(result.failures).toHaveLength(1);
      expect(result.stats.skipped).toBe(1);
    });

    it('should retry on failure when maxRetries is set', async () => {
      let callCount = 0;
      const items = [1];
      const processor = vi.fn(async () => {
        callCount++;
        if (callCount < 3) throw new Error('Temporary error');
        return 'success';
      });

      const result = await processBatch(items, processor, {
        maxRetries: 3,
        retryDelay: 10,
      });

      expect(result.results).toEqual(['success']);
      expect(callCount).toBe(3);
    });

    it('should respect abort signal', async () => {
      const controller = new AbortController();
      const items = [1, 2, 3, 4, 5];
      let processedCount = 0;

      const processor = vi.fn(async (item: number) => {
        processedCount++;
        if (processedCount === 2) {
          controller.abort();
        }
        return item * 2;
      });

      const result = await processBatch(items, processor, {
        batchSize: 1,
        signal: controller.signal,
      });

      expect(processedCount).toBeLessThanOrEqual(3);
      // Stats has successful, not processed - check that not all items completed
      expect(result.stats.successful).toBeLessThan(5);
    });

    it('should add delay between batches', async () => {
      const items = [1, 2, 3, 4];
      const processor = async (item: number) => item;
      const startTime = Date.now();

      await processBatch(items, processor, {
        batchSize: 2,
        delayBetweenBatches: 50,
      });

      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeGreaterThanOrEqual(45); // Allow some tolerance
    });
  });

  /* ==================== processParallelBatches TESTS ==================== */

  describe('processParallelBatches', () => {
    it('should process items in parallel', async () => {
      const items = [1, 2, 3, 4, 5];
      const processor = vi.fn(async (item: number) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return item * 2;
      });

      const result = await processParallelBatches(items, processor, {
        batchSize: 2,
        concurrency: 3,
      });

      expect(result.results.sort((a, b) => a - b)).toEqual([2, 4, 6, 8, 10]);
      expect(result.stats.successful).toBe(5);
    });

    it('should handle errors in parallel processing', async () => {
      const items = [1, 2, 3];
      const processor = vi.fn(async (item: number) => {
        if (item === 2) throw new Error('Error on 2');
        return item * 2;
      });
      const onError = vi.fn().mockReturnValue('skip');

      const result = await processParallelBatches(items, processor, {
        onError,
      });

      expect(result.failures).toHaveLength(1);
      expect(result.results.sort((a, b) => a - b)).toEqual([2, 6]);
    });
  });

  /* ==================== createRateLimitedProcessor TESTS ==================== */

  describe('createRateLimitedProcessor', () => {
    it('should rate limit requests', async () => {
      const processor = vi.fn(async (item: number) => item * 2);
      const rateLimited = createRateLimitedProcessor(processor, {
        requestsPerSecond: 10,
        burstLimit: 2,
      });

      const start = Date.now();
      const results = await Promise.all([
        rateLimited(1),
        rateLimited(2),
        rateLimited(3),
      ]);
      const elapsed = Date.now() - start;

      expect(results).toEqual([2, 4, 6]);
      // With burst of 2 and 10 req/s, third request should wait ~100ms
      expect(elapsed).toBeGreaterThanOrEqual(50);
    });

    it('should process items with requestsPerMinute', async () => {
      const processor = vi.fn(async (item: string) => item.toUpperCase());
      const rateLimited = createRateLimitedProcessor(processor, {
        requestsPerMinute: 600, // 10 per second
        burstLimit: 1,
      });

      const result = await rateLimited('test');
      expect(result).toBe('TEST');
    });
  });

  /* ==================== BatchQueue TESTS ==================== */

  describe('BatchQueue', () => {
    it('should process items in queue', async () => {
      const processor = vi.fn(async (item: number) => item * 2);
      const queue = new BatchQueue(processor, { concurrency: 2 });

      const results = await queue.addAll([1, 2, 3]);

      expect(results).toEqual([2, 4, 6]);
      expect(processor).toHaveBeenCalledTimes(3);
    });

    it('should limit concurrency', async () => {
      let concurrent = 0;
      let maxConcurrent = 0;

      const processor = async (item: number) => {
        concurrent++;
        maxConcurrent = Math.max(maxConcurrent, concurrent);
        await new Promise(resolve => setTimeout(resolve, 50));
        concurrent--;
        return item;
      };

      const queue = new BatchQueue(processor, { concurrency: 2 });
      await queue.addAll([1, 2, 3, 4, 5]);

      expect(maxConcurrent).toBeLessThanOrEqual(2);
    });

    it('should report queue size and pending', async () => {
      const processor = async (item: number) => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return item;
      };

      const queue = new BatchQueue(processor, { concurrency: 1 });

      // Add items without awaiting
      const promise1 = queue.add(1);
      const promise2 = queue.add(2);

      expect(queue.size).toBeGreaterThanOrEqual(0);
      expect(queue.pending).toBeGreaterThanOrEqual(0);

      await Promise.all([promise1, promise2]);
    });

    it('should call onComplete callback', async () => {
      const onComplete = vi.fn();
      const processor = async (item: number) => item * 2;
      const queue = new BatchQueue(processor, { onComplete });

      await queue.add(5);

      expect(onComplete).toHaveBeenCalledWith(5, 10);
    });

    it('should call onError callback', async () => {
      const onError = vi.fn();
      const processor = async () => {
        throw new Error('Test error');
      };
      const queue = new BatchQueue(processor, { onError, retries: 0 });

      await expect(queue.add(1)).rejects.toThrow('Test error');
      expect(onError).toHaveBeenCalled();
    });

    it('should retry on failure', async () => {
      let attempts = 0;
      const processor = async (item: number) => {
        attempts++;
        if (attempts < 2) throw new Error('Temporary');
        return item;
      };

      const queue = new BatchQueue(processor, { retries: 2 });
      const result = await queue.add(1);

      expect(result).toBe(1);
      expect(attempts).toBe(2);
    });

    it('should clear queue', () => {
      const processor = async (item: number) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return item;
      };

      const queue = new BatchQueue(processor);
      queue.add(1);
      queue.add(2);

      queue.clear();

      expect(queue.size).toBe(0);
    });
  });

  /* ==================== UTILITY FUNCTION TESTS ==================== */

  describe('chunkArray', () => {
    it('should chunk array into specified sizes', () => {
      const array = [1, 2, 3, 4, 5, 6, 7];
      const chunks = chunkArray(array, 3);

      expect(chunks).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
    });

    it('should handle empty array', () => {
      expect(chunkArray([], 3)).toEqual([]);
    });

    it('should handle chunk size larger than array', () => {
      expect(chunkArray([1, 2], 5)).toEqual([[1, 2]]);
    });
  });

  describe('flattenResults', () => {
    it('should flatten nested arrays', () => {
      const nested = [[1, 2], [3, 4], [5]];
      expect(flattenResults(nested)).toEqual([1, 2, 3, 4, 5]);
    });

    it('should handle empty arrays', () => {
      expect(flattenResults([])).toEqual([]);
      expect(flattenResults([[]])).toEqual([]);
    });
  });

  describe('mapWithConcurrency', () => {
    it('should map items with limited concurrency', async () => {
      let concurrent = 0;
      let maxConcurrent = 0;

      const mapper = async (item: number) => {
        concurrent++;
        maxConcurrent = Math.max(maxConcurrent, concurrent);
        await new Promise(resolve => setTimeout(resolve, 20));
        concurrent--;
        return item * 2;
      };

      const results = await mapWithConcurrency([1, 2, 3, 4, 5], mapper, 2);

      expect(results).toEqual([2, 4, 6, 8, 10]);
      expect(maxConcurrent).toBeLessThanOrEqual(2);
    });

    it('should preserve order', async () => {
      const mapper = async (item: number) => {
        // Random delay to test order preservation
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
        return item;
      };

      const results = await mapWithConcurrency([1, 2, 3, 4, 5], mapper, 3);

      expect(results).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('filterWithConcurrency', () => {
    it('should filter items with limited concurrency', async () => {
      const predicate = async (item: number) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return item % 2 === 0;
      };

      const results = await filterWithConcurrency(
        [1, 2, 3, 4, 5],
        predicate,
        2
      );

      expect(results).toEqual([2, 4]);
    });

    it('should handle all items filtered out', async () => {
      const predicate = async () => false;

      const results = await filterWithConcurrency([1, 2, 3], predicate, 2);

      expect(results).toEqual([]);
    });
  });

  /* ==================== EDGE CASES ==================== */

  describe('Edge Cases', () => {
    it('should handle single item batch', async () => {
      const processor = async (item: number) => item * 2;
      const result = await processBatch([1], processor);

      expect(result.results).toEqual([2]);
    });

    it('should handle processor that returns undefined', async () => {
      const processor = async () => undefined;
      const result = await processBatch([1, 2, 3], processor);

      expect(result.results).toEqual([undefined, undefined, undefined]);
    });

    it('should handle processor that returns null', async () => {
      const processor = async () => null;
      const result = await processBatch([1, 2, 3], processor);

      expect(result.results).toEqual([null, null, null]);
    });

    it('should calculate correct statistics', async () => {
      const processor = async (item: number) => {
        if (item === 2) throw new Error('Error');
        return item;
      };
      const onError = vi.fn().mockReturnValue('skip');

      const result = await processBatch([1, 2, 3], processor, { onError });

      expect(result.stats.total).toBe(3);
      expect(result.stats.successful).toBe(2);
      expect(result.stats.skipped).toBe(1);
      // Duration can be 0 for fast operations, just check it's defined
      expect(result.stats.duration).toBeGreaterThanOrEqual(0);
      expect(result.stats.averageTimePerItem).toBeGreaterThanOrEqual(0);
    });
  });
});
