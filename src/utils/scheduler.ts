/**
 * Scheduler/Timer Utilities
 * @module utils/scheduler
 * @description Job scheduling, interval management, and cron-like functionality.
 */

import { isBrowser } from './dom';

/**
 * Timer handle
 */
export interface TimerHandle {
  /** Cancel the timer */
  cancel(): void;
  /** Check if timer is active */
  isActive(): boolean;
  /** Get remaining time in ms */
  remaining(): number;
  /** Pause the timer (if supported) */
  pause(): void;
  /** Resume the timer (if supported) */
  resume(): void;
}

/**
 * Create a cancellable timeout
 * @param callback - Function to call
 * @param delay - Delay in milliseconds
 * @returns Timer handle
 * @example
 * const timer = timeout(() => console.log('Hello'), 1000);
 * timer.cancel(); // Cancel before it fires
 */
export function timeout(callback: () => void, delay: number): TimerHandle {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let startTime = Date.now();
  let remainingTime = delay;
  let isPaused = false;

  const start = (): void => {
    startTime = Date.now();
    timeoutId = setTimeout(() => {
      timeoutId = null;
      callback();
    }, remainingTime);
  };

  start();

  return {
    cancel(): void {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    },

    isActive(): boolean {
      return timeoutId !== null;
    },

    remaining(): number {
      if (timeoutId === null) return 0;
      if (isPaused) return remainingTime;
      return Math.max(0, remainingTime - (Date.now() - startTime));
    },

    pause(): void {
      if (timeoutId !== null && !isPaused) {
        clearTimeout(timeoutId);
        remainingTime = Math.max(0, remainingTime - (Date.now() - startTime));
        isPaused = true;
      }
    },

    resume(): void {
      if (isPaused) {
        isPaused = false;
        start();
      }
    },
  };
}

/**
 * Create a cancellable interval
 * @param callback - Function to call
 * @param interval - Interval in milliseconds
 * @param options - Options
 * @returns Timer handle
 */
export function interval(
  callback: () => void,
  intervalMs: number,
  options: {
    /** Run immediately */
    immediate?: boolean;
    /** Maximum number of runs */
    maxRuns?: number;
  } = {}
): TimerHandle & { runCount: number } {
  const { immediate = false, maxRuns = Infinity } = options;

  let intervalId: ReturnType<typeof setInterval> | null = null;
  let runCount = 0;
  let isPaused = false;
  // Used for potential pause tracking (assigned but read could be added for resume timing)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let pauseStartTime = 0;
  let lastRunTime = Date.now();

  const run = (): void => {
    if (runCount >= maxRuns) {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
      return;
    }

    runCount++;
    lastRunTime = Date.now();
    callback();
  };

  if (immediate) {
    run();
  }

  intervalId = setInterval(run, intervalMs);

  return {
    runCount: 0,

    cancel(): void {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    },

    isActive(): boolean {
      return intervalId !== null && !isPaused;
    },

    remaining(): number {
      if (intervalId === null) return 0;
      const elapsed = Date.now() - lastRunTime;
      return Math.max(0, intervalMs - elapsed);
    },

    pause(): void {
      if (intervalId !== null && !isPaused) {
        clearInterval(intervalId);
        intervalId = null;
        isPaused = true;
        pauseStartTime = Date.now();
      }
    },

    resume(): void {
      if (isPaused) {
        isPaused = false;
        intervalId = setInterval(run, intervalMs);
      }
    },
  };
}

/**
 * Debounce options
 */
export interface DebounceOptions {
  /** Call on leading edge */
  leading?: boolean;
  /** Call on trailing edge */
  trailing?: boolean;
  /** Maximum wait time */
  maxWait?: number;
}

/**
 * Create a debounced function
 * @param fn - Function to debounce
 * @param wait - Wait time in ms
 * @param options - Options
 * @example
 * const debouncedSearch = debounce((query) => search(query), 300);
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  wait: number,
  options: DebounceOptions = {}
): T & { cancel: () => void; flush: () => void } {
  const { leading = false, trailing = true, maxWait } = options;

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let maxTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastCallTime: number | undefined;
  let lastInvokeTime = 0;

  const invokeFunc = (time: number): ReturnType<T> | undefined => {
    const args = lastArgs;
    lastArgs = null;
    lastInvokeTime = time;
    if (args) {
      return fn(...args) as ReturnType<T>;
    }
    return undefined;
  };

  const startTimer = (
    pendingFunc: () => void,
    waitTime: number
  ): ReturnType<typeof setTimeout> => {
    return setTimeout(pendingFunc, waitTime);
  };

  const cancelTimer = (id: ReturnType<typeof setTimeout> | null): void => {
    if (id !== null) {
      clearTimeout(id);
    }
  };

  const trailingEdge = (time: number): ReturnType<T> | undefined => {
    timeoutId = null;

    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = null;
    return undefined;
  };

  const timerExpired = (): void => {
    const time = Date.now();
    trailingEdge(time);
  };

  const leadingEdge = (time: number): ReturnType<T> | undefined => {
    lastInvokeTime = time;
    timeoutId = startTimer(timerExpired, wait);

    if (maxWait !== undefined) {
      maxTimeoutId = startTimer(() => {
        if (timeoutId !== null) {
          cancelTimer(timeoutId);
          timeoutId = null;
          invokeFunc(Date.now());
        }
      }, maxWait);
    }

    return leading ? invokeFunc(time) : undefined;
  };

  const shouldInvoke = (time: number): boolean => {
    const timeSinceLastCall =
      lastCallTime === undefined ? 0 : time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      lastCallTime === undefined ||
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0 ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    );
  };

  const debounced = function (
    this: unknown,
    ...args: Parameters<T>
  ): ReturnType<T> | undefined {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastCallTime = time;

    if (isInvoking) {
      if (timeoutId === null) {
        return leadingEdge(time);
      }
      if (maxWait !== undefined) {
        timeoutId = startTimer(timerExpired, wait);
        return invokeFunc(time);
      }
    }

    if (timeoutId === null) {
      timeoutId = startTimer(timerExpired, wait);
    }

    return undefined;
  } as T & { cancel: () => void; flush: () => void };

  debounced.cancel = (): void => {
    cancelTimer(timeoutId);
    cancelTimer(maxTimeoutId);
    timeoutId = null;
    maxTimeoutId = null;
    lastArgs = null;
    lastCallTime = undefined;
    lastInvokeTime = 0;
  };

  debounced.flush = (): void => {
    if (timeoutId !== null) {
      trailingEdge(Date.now());
    }
  };

  return debounced;
}

/**
 * Throttle options
 */
export interface ThrottleOptions {
  /** Call on leading edge */
  leading?: boolean;
  /** Call on trailing edge */
  trailing?: boolean;
}

/**
 * Create a throttled function
 * @param fn - Function to throttle
 * @param wait - Minimum time between calls
 * @param options - Options
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  wait: number,
  options: ThrottleOptions = {}
): T & { cancel: () => void } {
  const { leading = true, trailing = true } = options;

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastCallTime = 0;

  const throttled = function (
    this: unknown,
    ...args: Parameters<T>
  ): ReturnType<T> | undefined {
    const now = Date.now();
    const remaining = wait - (now - lastCallTime);

    lastArgs = args;

    if (remaining <= 0 || remaining > wait) {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      lastCallTime = now;

      if (leading) {
        return fn(...args) as ReturnType<T>;
      }
    } else if (timeoutId === null && trailing) {
      timeoutId = setTimeout(() => {
        lastCallTime = leading ? Date.now() : 0;
        timeoutId = null;
        if (lastArgs) {
          fn(...lastArgs);
          lastArgs = null;
        }
      }, remaining);
    }

    return undefined;
  } as T & { cancel: () => void };

  throttled.cancel = (): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
    lastCallTime = 0;
  };

  return throttled;
}

// ============================================================================
// Scheduler
// ============================================================================

/**
 * Scheduled job
 */
export interface ScheduledJob {
  /** Job ID */
  id: string;
  /** Job name */
  name?: string;
  /** Schedule pattern */
  pattern: string;
  /** Job callback */
  callback: () => void | Promise<void>;
  /** Next run time */
  nextRun: Date | null;
  /** Last run time */
  lastRun: Date | null;
  /** Run count */
  runCount: number;
  /** Is job active */
  active: boolean;
}

/**
 * Scheduler instance
 */
export interface Scheduler {
  /** Schedule a job */
  schedule(
    pattern: string,
    callback: () => void | Promise<void>,
    options?: { name?: string; immediate?: boolean }
  ): string;
  /** Cancel a job */
  cancel(jobId: string): boolean;
  /** Get job info */
  getJob(jobId: string): ScheduledJob | undefined;
  /** Get all jobs */
  getJobs(): ScheduledJob[];
  /** Pause a job */
  pause(jobId: string): void;
  /** Resume a job */
  resume(jobId: string): void;
  /** Run a job immediately */
  run(jobId: string): Promise<void>;
  /** Start scheduler */
  start(): void;
  /** Stop scheduler */
  stop(): void;
  /** Destroy scheduler */
  destroy(): void;
}

/**
 * Parse simple cron-like pattern
 * Supports: "* * * * *" (min hour day month weekday)
 * Or simple intervals: "every 5m", "every 1h", "every 30s"
 */
function parseCronPattern(pattern: string): ((date: Date) => boolean) | number {
  // Simple interval patterns
  const intervalMatch = pattern.match(/^every\s+(\d+)\s*(s|m|h|d)$/i);
  if (intervalMatch) {
    const value = parseInt(intervalMatch[1], 10);
    const unit = intervalMatch[2].toLowerCase();

    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return value * multipliers[unit];
  }

  // Cron-like pattern
  const parts = pattern.split(/\s+/);
  if (parts.length !== 5) {
    throw new Error(`Invalid cron pattern: ${pattern}`);
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const matchField = (field: string, value: number, max: number): boolean => {
    if (field === '*') return true;

    // Range: 1-5
    if (field.includes('-')) {
      const [start, end] = field.split('-').map(Number);
      return value >= start && value <= end;
    }

    // Step: */5
    if (field.startsWith('*/')) {
      const step = parseInt(field.slice(2), 10);
      return value % step === 0;
    }

    // List: 1,3,5
    if (field.includes(',')) {
      return field.split(',').map(Number).includes(value);
    }

    return parseInt(field, 10) === value;
  };

  return (date: Date): boolean => {
    return (
      matchField(minute, date.getMinutes(), 59) &&
      matchField(hour, date.getHours(), 23) &&
      matchField(dayOfMonth, date.getDate(), 31) &&
      matchField(month, date.getMonth() + 1, 12) &&
      matchField(dayOfWeek, date.getDay(), 6)
    );
  };
}

/**
 * Create a job scheduler
 * @returns Scheduler instance
 * @example
 * const scheduler = createScheduler();
 *
 * // Run every 5 minutes
 * scheduler.schedule('every 5m', () => console.log('Tick'));
 *
 * // Run at specific times (cron-like)
 * scheduler.schedule('0 9 * * 1-5', () => console.log('Weekday 9am'));
 *
 * scheduler.start();
 */
export function createScheduler(): Scheduler {
  const jobs = new Map<
    string,
    ScheduledJob & { timerId?: ReturnType<typeof setTimeout> }
  >();
  let isRunning = false;
  let checkIntervalId: ReturnType<typeof setInterval> | null = null;

  let jobIdCounter = 0;
  const generateId = (): string => `job_${++jobIdCounter}`;

  const calculateNextRun = (
    pattern: string,
    from: Date = new Date()
  ): Date | null => {
    const parsed = parseCronPattern(pattern);

    // Interval pattern
    if (typeof parsed === 'number') {
      return new Date(from.getTime() + parsed);
    }

    // Cron pattern - find next matching minute
    const next = new Date(from);
    next.setSeconds(0, 0);
    next.setMinutes(next.getMinutes() + 1);

    // Search up to 366 days
    for (let i = 0; i < 527040; i++) {
      if (parsed(next)) {
        return next;
      }
      next.setMinutes(next.getMinutes() + 1);
    }

    return null;
  };

  const scheduleNextRun = (
    job: ScheduledJob & { timerId?: ReturnType<typeof setTimeout> }
  ): void => {
    if (!isRunning || !job.active) return;

    const nextRun = calculateNextRun(job.pattern);
    if (!nextRun) return;

    job.nextRun = nextRun;
    const delay = nextRun.getTime() - Date.now();

    if (delay > 0 && delay < 2147483647) {
      // Max setTimeout value
      job.timerId = setTimeout(async () => {
        if (!job.active) return;

        job.lastRun = new Date();
        job.runCount++;

        try {
          await job.callback();
        } catch (error) {
          console.error(`Job ${job.id} error:`, error);
        }

        scheduleNextRun(job);
      }, delay);
    }
  };

  const checkCronJobs = (): void => {
    const now = new Date();

    jobs.forEach(job => {
      if (!job.active || job.timerId) return;

      const parsed = parseCronPattern(job.pattern);
      if (typeof parsed === 'function' && parsed(now)) {
        job.lastRun = new Date();
        job.runCount++;
        job.callback();
      }
    });
  };

  return {
    schedule(
      pattern: string,
      callback: () => void | Promise<void>,
      options: { name?: string; immediate?: boolean } = {}
    ): string {
      const { name, immediate = false } = options;
      const id = generateId();

      const job: ScheduledJob & { timerId?: ReturnType<typeof setTimeout> } = {
        id,
        name,
        pattern,
        callback,
        nextRun: null,
        lastRun: null,
        runCount: 0,
        active: true,
      };

      jobs.set(id, job);

      if (immediate) {
        job.lastRun = new Date();
        job.runCount++;
        callback();
      }

      if (isRunning) {
        scheduleNextRun(job);
      }

      return id;
    },

    cancel(jobId: string): boolean {
      const job = jobs.get(jobId);
      if (!job) return false;

      if (job.timerId) {
        clearTimeout(job.timerId);
      }

      jobs.delete(jobId);
      return true;
    },

    getJob(jobId: string): ScheduledJob | undefined {
      const job = jobs.get(jobId);
      if (!job) return undefined;

      // Return without internal timer - omit timerId from public API
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { timerId, ...publicJob } = job;
      return publicJob;
    },

    getJobs(): ScheduledJob[] {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      return Array.from(jobs.values()).map(({ timerId, ...job }) => job);
    },

    pause(jobId: string): void {
      const job = jobs.get(jobId);
      if (job) {
        job.active = false;
        if (job.timerId) {
          clearTimeout(job.timerId);
          job.timerId = undefined;
        }
      }
    },

    resume(jobId: string): void {
      const job = jobs.get(jobId);
      if (job) {
        job.active = true;
        if (isRunning) {
          scheduleNextRun(job);
        }
      }
    },

    async run(jobId: string): Promise<void> {
      const job = jobs.get(jobId);
      if (job) {
        job.lastRun = new Date();
        job.runCount++;
        await job.callback();
      }
    },

    start(): void {
      if (isRunning) return;
      isRunning = true;

      // Schedule interval-based jobs
      jobs.forEach(job => {
        if (job.active) {
          scheduleNextRun(job);
        }
      });

      // Check cron patterns every minute
      checkIntervalId = setInterval(checkCronJobs, 60000);
    },

    stop(): void {
      isRunning = false;

      if (checkIntervalId) {
        clearInterval(checkIntervalId);
        checkIntervalId = null;
      }

      jobs.forEach(job => {
        if (job.timerId) {
          clearTimeout(job.timerId);
          job.timerId = undefined;
        }
      });
    },

    destroy(): void {
      this.stop();
      jobs.clear();
    },
  };
}

// ============================================================================
// Animation Frame
// ============================================================================

/**
 * Request animation frame with cleanup
 */
export function requestFrame(callback: FrameRequestCallback): () => void {
  if (!isBrowser()) {
    return () => {};
  }

  const id = requestAnimationFrame(callback);
  return () => cancelAnimationFrame(id);
}

/**
 * Create an animation loop
 * @param callback - Called each frame with delta time
 * @returns Cleanup function
 */
export function createLoop(
  callback: (deltaTime: number, totalTime: number) => void
): { start: () => void; stop: () => void; isRunning: () => boolean } {
  let rafId: number | null = null;
  let lastTime = 0;
  let totalTime = 0;
  let running = false;

  const tick = (currentTime: number): void => {
    if (!running) return;

    const deltaTime = lastTime ? currentTime - lastTime : 0;
    lastTime = currentTime;
    totalTime += deltaTime;

    callback(deltaTime, totalTime);

    rafId = requestAnimationFrame(tick);
  };

  return {
    start(): void {
      if (running) return;
      running = true;
      lastTime = 0;
      rafId = requestAnimationFrame(tick);
    },

    stop(): void {
      running = false;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    },

    isRunning(): boolean {
      return running;
    },
  };
}

/**
 * Run callback on next idle period
 */
export function requestIdleCallback(
  callback: IdleRequestCallback,
  options?: IdleRequestOptions
): () => void {
  if (!isBrowser()) {
    return () => {};
  }

  if ('requestIdleCallback' in window) {
    const id = window.requestIdleCallback(callback, options);
    return () => window.cancelIdleCallback(id);
  }

  // Fallback for browsers without requestIdleCallback
  const id = setTimeout(
    () => callback({ didTimeout: false, timeRemaining: () => 50 }),
    1
  );
  return () => clearTimeout(id);
}

/**
 * Wait for a number of frames
 */
export function waitFrames(count: number): Promise<void> {
  return new Promise(resolve => {
    let remaining = count;

    const tick = (): void => {
      remaining--;
      if (remaining <= 0) {
        resolve();
      } else {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  });
}

/**
 * Sleep for a duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wait until a condition is true
 */
export function waitUntil(
  condition: () => boolean,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const { timeout = 10000, interval: checkInterval = 100 } = options;

  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const check = (): void => {
      if (condition()) {
        resolve();
        return;
      }

      if (Date.now() - startTime >= timeout) {
        reject(new Error('Condition timeout'));
        return;
      }

      setTimeout(check, checkInterval);
    };

    check();
  });
}
