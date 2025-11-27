/**
 * Batch processing utilities for handling large datasets efficiently
 * @module batch
 */

import { logger } from './logger';

/* ==================== TYPES ==================== */

export interface BatchOptions<T, R> {
  /** Number of items to process per batch */
  batchSize?: number;
  /** Delay between batches in milliseconds */
  delayBetweenBatches?: number;
  /** Maximum concurrent batches (for parallel processing) */
  concurrency?: number;
  /** Callback for progress reporting */
  onProgress?: (progress: BatchProgress<T, R>) => void;
  /** Callback for batch completion */
  onBatchComplete?: (batch: T[], results: R[]) => void;
  /** Callback for errors */
  onError?: (error: Error, item: T, index: number) => 'skip' | 'stop' | 'retry';
  /** Maximum retries per item */
  maxRetries?: number;
  /** Retry delay in milliseconds */
  retryDelay?: number;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
}

export interface BatchProgress<T, R> {
  /** Total number of items */
  total: number;
  /** Number of processed items */
  processed: number;
  /** Number of successful items */
  successful: number;
  /** Number of failed items */
  failed: number;
  /** Current batch number */
  currentBatch: number;
  /** Total number of batches */
  totalBatches: number;
  /** Percentage complete */
  percentage: number;
  /** Estimated time remaining in milliseconds */
  estimatedTimeRemaining: number | null;
  /** Current item being processed */
  currentItem?: T;
  /** Last result */
  lastResult?: R;
}

export interface BatchResult<T, R> {
  /** All successful results */
  results: R[];
  /** Failed items with their errors */
  failures: Array<{ item: T; error: Error; index: number }>;
  /** Processing statistics */
  stats: {
    total: number;
    successful: number;
    failed: number;
    skipped: number;
    duration: number;
    averageTimePerItem: number;
  };
}

/* ==================== BATCH PROCESSORS ==================== */

/**
 * Process items in batches with configurable options
 */
export async function processBatch<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  options: BatchOptions<T, R> = {}
): Promise<BatchResult<T, R>> {
  const {
    batchSize = 10,
    delayBetweenBatches = 0,
    onProgress,
    onBatchComplete,
    onError,
    maxRetries = 0,
    retryDelay = 1000,
    signal,
  } = options;

  const startTime = Date.now();
  const results: R[] = [];
  const failures: Array<{ item: T; error: Error; index: number }> = [];
  let processed = 0;
  let successful = 0;
  let failed = 0;
  let skipped = 0;

  const totalBatches = Math.ceil(items.length / batchSize);

  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    // Check for cancellation
    if (signal?.aborted) {
      logger.info('Batch processing cancelled', { batchIndex, processed });
      break;
    }

    const start = batchIndex * batchSize;
    const end = Math.min(start + batchSize, items.length);
    const batch = items.slice(start, end);
    const batchResults: R[] = [];

    for (let i = 0; i < batch.length; i++) {
      const globalIndex = start + i;
      const item = batch[i];
      let retries = 0;
      let success = false;

      while (!success && retries <= maxRetries) {
        try {
          if (signal?.aborted) break;

          const result = await processor(item, globalIndex);
          results.push(result);
          batchResults.push(result);
          successful++;
          success = true;

          // Report progress
          if (onProgress) {
            const elapsed = Date.now() - startTime;
            const avgTime = elapsed / (processed + 1);
            const remaining = items.length - processed - 1;

            onProgress({
              total: items.length,
              processed: processed + 1,
              successful,
              failed,
              currentBatch: batchIndex + 1,
              totalBatches,
              percentage: ((processed + 1) / items.length) * 100,
              estimatedTimeRemaining:
                remaining > 0 ? avgTime * remaining : null,
              currentItem: item,
              lastResult: result,
            });
          }
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));

          if (retries < maxRetries) {
            retries++;
            logger.warn('Batch item failed, retrying', {
              index: globalIndex,
              retry: retries,
              maxRetries,
            });
            await sleep(retryDelay * retries); // Exponential backoff
            continue;
          }

          // Handle error based on callback
          let action: 'skip' | 'stop' | 'retry' = 'skip';
          if (onError) {
            action = onError(err, item, globalIndex);
          }

          if (action === 'stop') {
            failures.push({ item, error: err, index: globalIndex });
            failed++;
            throw err;
          } else if (action === 'retry' && retries < maxRetries) {
            retries++;
            await sleep(retryDelay * retries);
            continue;
          } else {
            failures.push({ item, error: err, index: globalIndex });
            if (action === 'skip') {
              skipped++;
            } else {
              failed++;
            }
          }
          break;
        }
      }

      processed++;
    }

    // Batch complete callback
    if (onBatchComplete) {
      onBatchComplete(batch, batchResults);
    }

    // Delay between batches
    if (delayBetweenBatches > 0 && batchIndex < totalBatches - 1) {
      await sleep(delayBetweenBatches);
    }
  }

  const duration = Date.now() - startTime;

  return {
    results,
    failures,
    stats: {
      total: items.length,
      successful,
      failed,
      skipped,
      duration,
      averageTimePerItem: duration / processed || 0,
    },
  };
}

/**
 * Process items in parallel batches with controlled concurrency
 */
export async function processParallelBatches<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  options: BatchOptions<T, R> = {}
): Promise<BatchResult<T, R>> {
  const {
    batchSize = 10,
    concurrency = 3,
    onProgress,
    onError,
    maxRetries = 0,
    retryDelay = 1000,
    signal,
  } = options;

  const startTime = Date.now();
  const results: R[] = new Array(items.length);
  const failures: Array<{ item: T; error: Error; index: number }> = [];
  let successful = 0;
  let failed = 0;
  let skipped = 0;
  let processed = 0;

  // Create chunks
  const chunks: Array<{ items: T[]; startIndex: number }> = [];
  for (let i = 0; i < items.length; i += batchSize) {
    chunks.push({
      items: items.slice(i, i + batchSize),
      startIndex: i,
    });
  }

  // Process chunks with limited concurrency
  const processChunk = async (chunk: {
    items: T[];
    startIndex: number;
  }): Promise<void> => {
    for (let i = 0; i < chunk.items.length; i++) {
      if (signal?.aborted) return;

      const globalIndex = chunk.startIndex + i;
      const item = chunk.items[i];
      let retries = 0;

      while (retries <= maxRetries) {
        try {
          const result = await processor(item, globalIndex);
          results[globalIndex] = result;
          successful++;
          processed++;

          if (onProgress) {
            const elapsed = Date.now() - startTime;
            const avgTime = elapsed / processed;
            const remaining = items.length - processed;

            onProgress({
              total: items.length,
              processed,
              successful,
              failed,
              currentBatch: Math.floor(globalIndex / batchSize) + 1,
              totalBatches: chunks.length,
              percentage: (processed / items.length) * 100,
              estimatedTimeRemaining:
                remaining > 0 ? avgTime * remaining : null,
              currentItem: item,
              lastResult: result,
            });
          }
          break;
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));

          if (retries < maxRetries) {
            retries++;
            await sleep(retryDelay * retries);
            continue;
          }

          let action: 'skip' | 'stop' | 'retry' = 'skip';
          if (onError) {
            action = onError(err, item, globalIndex);
          }

          if (action === 'stop') {
            throw err;
          }

          failures.push({ item, error: err, index: globalIndex });
          if (action === 'skip') {
            skipped++;
          } else {
            failed++;
          }
          processed++;
          break;
        }
      }
    }
  };

  // Run with concurrency limit
  await runWithConcurrency(chunks, processChunk, concurrency);

  const duration = Date.now() - startTime;

  return {
    results: results.filter(r => r !== undefined),
    failures,
    stats: {
      total: items.length,
      successful,
      failed,
      skipped,
      duration,
      averageTimePerItem: duration / processed || 0,
    },
  };
}

/**
 * Process a stream of items with backpressure support
 */
export async function* processStream<T, R>(
  items: AsyncIterable<T> | Iterable<T>,
  processor: (item: T, index: number) => Promise<R>,
  options: { batchSize?: number; signal?: AbortSignal } = {}
): AsyncGenerator<R, void, unknown> {
  const { batchSize = 1, signal } = options;
  let batch: T[] = [];
  let index = 0;

  for await (const item of items) {
    if (signal?.aborted) break;

    batch.push(item);

    if (batch.length >= batchSize) {
      for (const batchItem of batch) {
        yield await processor(batchItem, index++);
      }
      batch = [];
    }
  }

  // Process remaining items
  for (const item of batch) {
    if (signal?.aborted) break;
    yield await processor(item, index++);
  }
}

/* ==================== RATE LIMITING ==================== */

/**
 * Create a rate-limited processor
 */
export function createRateLimitedProcessor<T, R>(
  processor: (item: T) => Promise<R>,
  options: {
    requestsPerSecond?: number;
    requestsPerMinute?: number;
    burstLimit?: number;
  } = {}
): (item: T) => Promise<R> {
  const { requestsPerSecond, requestsPerMinute, burstLimit = 1 } = options;

  let tokens = burstLimit;
  let lastRefill = Date.now();

  const refillRate = requestsPerSecond
    ? 1000 / requestsPerSecond
    : requestsPerMinute
      ? 60000 / requestsPerMinute
      : 100; // Default: 10 per second

  return async (item: T): Promise<R> => {
    // Refill tokens
    const now = Date.now();
    const elapsed = now - lastRefill;
    const newTokens = elapsed / refillRate;
    tokens = Math.min(burstLimit, tokens + newTokens);
    lastRefill = now;

    // Wait for token if needed
    if (tokens < 1) {
      const waitTime = (1 - tokens) * refillRate;
      await sleep(waitTime);
      tokens = 1;
      lastRefill = Date.now();
    }

    tokens--;
    return processor(item);
  };
}

/* ==================== QUEUE PROCESSOR ==================== */

export interface QueueOptions<T, R> {
  concurrency?: number;
  onComplete?: (item: T, result: R) => void;
  onError?: (item: T, error: Error) => void;
  retries?: number;
}

/**
 * Create a queue-based processor for managing async tasks
 */
export class BatchQueue<T, R> {
  private queue: Array<{
    item: T;
    resolve: (value: R) => void;
    reject: (error: Error) => void;
    retries: number;
  }> = [];
  private processing = 0;
  private readonly concurrency: number;
  private readonly processor: (item: T) => Promise<R>;
  private readonly options: QueueOptions<T, R>;

  constructor(
    processor: (item: T) => Promise<R>,
    options: QueueOptions<T, R> = {}
  ) {
    this.processor = processor;
    this.concurrency = options.concurrency ?? 5;
    this.options = options;
  }

  /**
   * Add an item to the queue
   */
  add(item: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.queue.push({ item, resolve, reject, retries: 0 });
      this.processNext();
    });
  }

  /**
   * Add multiple items to the queue
   */
  addAll(items: T[]): Promise<R[]> {
    return Promise.all(items.map(item => this.add(item)));
  }

  /**
   * Get queue size
   */
  get size(): number {
    return this.queue.length;
  }

  /**
   * Get number of items being processed
   */
  get pending(): number {
    return this.processing;
  }

  /**
   * Clear the queue
   */
  clear(): void {
    this.queue.forEach(({ reject }) => {
      reject(new Error('Queue cleared'));
    });
    this.queue = [];
  }

  private async processNext(): Promise<void> {
    if (this.processing >= this.concurrency || this.queue.length === 0) {
      return;
    }

    const task = this.queue.shift();
    if (!task) return;

    this.processing++;

    try {
      const result = await this.processor(task.item);
      task.resolve(result);
      this.options.onComplete?.(task.item, result);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      if (task.retries < (this.options.retries ?? 0)) {
        task.retries++;
        this.queue.unshift(task);
      } else {
        task.reject(err);
        this.options.onError?.(task.item, err);
      }
    } finally {
      this.processing--;
      this.processNext();
    }
  }
}

/* ==================== UTILITY FUNCTIONS ==================== */

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Run tasks with limited concurrency
 */
async function runWithConcurrency<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  concurrency: number
): Promise<R[]> {
  const results: R[] = [];
  const executing: Promise<void>[] = [];

  for (const item of items) {
    const promise = processor(item).then(result => {
      results.push(result);
    });

    executing.push(promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      // Remove completed promises
      for (let i = executing.length - 1; i >= 0; i--) {
        const status = await Promise.race([
          executing[i].then(() => 'fulfilled'),
          Promise.resolve('pending'),
        ]);
        if (status === 'fulfilled') {
          executing.splice(i, 1);
        }
      }
    }
  }

  await Promise.all(executing);
  return results;
}

/**
 * Chunk an array into smaller arrays
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Flatten nested arrays
 */
export function flattenResults<T>(results: T[][]): T[] {
  return results.flat();
}

/**
 * Map with concurrency limit
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  mapper: (item: T, index: number) => Promise<R>,
  concurrency: number
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let currentIndex = 0;

  async function worker(): Promise<void> {
    while (currentIndex < items.length) {
      const index = currentIndex++;
      results[index] = await mapper(items[index], index);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker()
  );

  await Promise.all(workers);
  return results;
}

/**
 * Filter with concurrency limit
 */
export async function filterWithConcurrency<T>(
  items: T[],
  predicate: (item: T, index: number) => Promise<boolean>,
  concurrency: number
): Promise<T[]> {
  const results = await mapWithConcurrency(
    items,
    async (item, index) => ({
      item,
      keep: await predicate(item, index),
    }),
    concurrency
  );

  return results.filter(r => r.keep).map(r => r.item);
}

/* ==================== EXPORTS ==================== */

export const batch = {
  process: processBatch,
  processParallel: processParallelBatches,
  processStream,
  createRateLimited: createRateLimitedProcessor,
  Queue: BatchQueue,
  chunk: chunkArray,
  flatten: flattenResults,
  map: mapWithConcurrency,
  filter: filterWithConcurrency,
};

export default batch;
