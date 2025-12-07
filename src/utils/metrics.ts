/**
 * Metrics and Observability Utilities
 * @module utils/metrics
 * @description Performance metrics, counters, histograms, and
 * observability utilities for monitoring application health.
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Metric types
 */
export type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary';

/**
 * Metric labels
 */
export type Labels = Record<string, string>;

/**
 * Metric options
 */
export interface MetricOptions {
  name: string;
  help?: string;
  labels?: string[];
}

/**
 * Histogram options
 */
export interface HistogramOptions extends MetricOptions {
  buckets?: number[];
}

/**
 * Summary options
 */
export interface SummaryOptions extends MetricOptions {
  percentiles?: number[];
  maxAge?: number;
  ageBuckets?: number;
}

/**
 * Metric value with labels
 */
export interface MetricValue {
  value: number;
  labels: Labels;
  timestamp: number;
}

/**
 * Histogram bucket
 */
export interface HistogramBucket {
  le: number;
  count: number;
}

/**
 * Histogram value
 */
export interface HistogramValue {
  labels: Labels;
  buckets: HistogramBucket[];
  sum: number;
  count: number;
}

/**
 * Summary value
 */
export interface SummaryValue {
  labels: Labels;
  quantiles: Map<number, number>;
  sum: number;
  count: number;
}

// ============================================================================
// Counter
// ============================================================================

/**
 * Monotonically increasing counter
 */
export class Counter {
  private values = new Map<string, number>();
  readonly type: MetricType = 'counter';

  constructor(readonly options: MetricOptions) {}

  /**
   * Increment counter
   */
  inc(labels: Labels = {}, amount = 1): void {
    if (amount < 0) {
      throw new Error('Counter can only be incremented');
    }
    const key = this.labelsToKey(labels);
    const current = this.values.get(key) ?? 0;
    this.values.set(key, current + amount);
  }

  /**
   * Get current value
   */
  get(labels: Labels = {}): number {
    const key = this.labelsToKey(labels);
    return this.values.get(key) ?? 0;
  }

  /**
   * Reset counter
   */
  reset(labels?: Labels): void {
    if (labels) {
      const key = this.labelsToKey(labels);
      this.values.delete(key);
    } else {
      this.values.clear();
    }
  }

  /**
   * Get all values
   */
  getAll(): MetricValue[] {
    const timestamp = Date.now();
    return Array.from(this.values.entries()).map(([key, value]) => ({
      value,
      labels: this.keyToLabels(key),
      timestamp,
    }));
  }

  private labelsToKey(labels: Labels): string {
    const sorted = Object.keys(labels)
      .sort()
      .map(k => `${k}="${labels[k]}"`)
      .join(',');
    return sorted || '__default__';
  }

  private keyToLabels(key: string): Labels {
    if (key === '__default__') return {};
    const labels: Labels = {};
    const pairs = key.split(',');
    for (const pair of pairs) {
      const match = pair.match(/^([^=]+)="([^"]*)"$/);
      if (match) {
        labels[match[1]] = match[2];
      }
    }
    return labels;
  }
}

// ============================================================================
// Gauge
// ============================================================================

/**
 * Gauge that can go up and down
 */
export class Gauge {
  private values = new Map<string, number>();
  readonly type: MetricType = 'gauge';

  constructor(readonly options: MetricOptions) {}

  /**
   * Set gauge value
   */
  set(value: number, labels: Labels = {}): void {
    const key = this.labelsToKey(labels);
    this.values.set(key, value);
  }

  /**
   * Increment gauge
   */
  inc(labels: Labels = {}, amount = 1): void {
    const key = this.labelsToKey(labels);
    const current = this.values.get(key) ?? 0;
    this.values.set(key, current + amount);
  }

  /**
   * Decrement gauge
   */
  dec(labels: Labels = {}, amount = 1): void {
    const key = this.labelsToKey(labels);
    const current = this.values.get(key) ?? 0;
    this.values.set(key, current - amount);
  }

  /**
   * Get current value
   */
  get(labels: Labels = {}): number {
    const key = this.labelsToKey(labels);
    return this.values.get(key) ?? 0;
  }

  /**
   * Set to current time
   */
  setToCurrentTime(labels: Labels = {}): void {
    this.set(Date.now() / 1000, labels);
  }

  /**
   * Track in progress
   */
  trackInProgress<T>(
    fn: () => T | Promise<T>,
    labels: Labels = {}
  ): T | Promise<T> {
    this.inc(labels);
    const result = fn();

    if (result instanceof Promise) {
      return result.finally(() => this.dec(labels));
    }

    this.dec(labels);
    return result;
  }

  /**
   * Get all values
   */
  getAll(): MetricValue[] {
    const timestamp = Date.now();
    return Array.from(this.values.entries()).map(([key, value]) => ({
      value,
      labels: this.keyToLabels(key),
      timestamp,
    }));
  }

  private labelsToKey(labels: Labels): string {
    const sorted = Object.keys(labels)
      .sort()
      .map(k => `${k}="${labels[k]}"`)
      .join(',');
    return sorted || '__default__';
  }

  private keyToLabels(key: string): Labels {
    if (key === '__default__') return {};
    const labels: Labels = {};
    const pairs = key.split(',');
    for (const pair of pairs) {
      const match = pair.match(/^([^=]+)="([^"]*)"$/);
      if (match) {
        labels[match[1]] = match[2];
      }
    }
    return labels;
  }
}

// ============================================================================
// Histogram
// ============================================================================

/**
 * Default histogram buckets
 */
export const DEFAULT_BUCKETS = [
  0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10,
];

/**
 * Histogram for measuring distributions
 */
export class Histogram {
  private data = new Map<
    string,
    { sum: number; count: number; values: number[] }
  >();
  readonly type: MetricType = 'histogram';
  readonly buckets: number[];

  constructor(readonly options: HistogramOptions) {
    this.buckets = [...(options.buckets ?? DEFAULT_BUCKETS)].sort(
      (a, b) => a - b
    );
  }

  /**
   * Observe a value
   */
  observe(value: number, labels: Labels = {}): void {
    const key = this.labelsToKey(labels);
    let data = this.data.get(key);

    if (!data) {
      data = { sum: 0, count: 0, values: [] };
      this.data.set(key, data);
    }

    data.sum += value;
    data.count++;
    data.values.push(value);
  }

  /**
   * Time a function
   */
  time<T>(fn: () => T, labels: Labels = {}): T {
    const start = performance.now();
    try {
      return fn();
    } finally {
      const duration = (performance.now() - start) / 1000;
      this.observe(duration, labels);
    }
  }

  /**
   * Time an async function
   */
  async timeAsync<T>(fn: () => Promise<T>, labels: Labels = {}): Promise<T> {
    const start = performance.now();
    try {
      return await fn();
    } finally {
      const duration = (performance.now() - start) / 1000;
      this.observe(duration, labels);
    }
  }

  /**
   * Create a timer
   */
  startTimer(labels: Labels = {}): () => number {
    const start = performance.now();
    return () => {
      const duration = (performance.now() - start) / 1000;
      this.observe(duration, labels);
      return duration;
    };
  }

  /**
   * Get histogram value
   */
  get(labels: Labels = {}): HistogramValue | undefined {
    const key = this.labelsToKey(labels);
    const data = this.data.get(key);

    if (!data) return undefined;

    const buckets: HistogramBucket[] = this.buckets.map(le => ({
      le,
      count: data.values.filter(v => v <= le).length,
    }));

    // Add +Inf bucket
    buckets.push({ le: Infinity, count: data.count });

    return {
      labels: this.keyToLabels(key),
      buckets,
      sum: data.sum,
      count: data.count,
    };
  }

  /**
   * Get all histogram values
   */
  getAll(): HistogramValue[] {
    return Array.from(this.data.keys()).map(key => {
      const labels = this.keyToLabels(key);
      return this.get(labels)!;
    });
  }

  /**
   * Reset histogram
   */
  reset(labels?: Labels): void {
    if (labels) {
      const key = this.labelsToKey(labels);
      this.data.delete(key);
    } else {
      this.data.clear();
    }
  }

  private labelsToKey(labels: Labels): string {
    const sorted = Object.keys(labels)
      .sort()
      .map(k => `${k}="${labels[k]}"`)
      .join(',');
    return sorted || '__default__';
  }

  private keyToLabels(key: string): Labels {
    if (key === '__default__') return {};
    const labels: Labels = {};
    const pairs = key.split(',');
    for (const pair of pairs) {
      const match = pair.match(/^([^=]+)="([^"]*)"$/);
      if (match) {
        labels[match[1]] = match[2];
      }
    }
    return labels;
  }
}

// ============================================================================
// Summary
// ============================================================================

/**
 * Default percentiles
 */
export const DEFAULT_PERCENTILES = [0.5, 0.9, 0.95, 0.99];

/**
 * Summary for calculating percentiles
 */
export class Summary {
  private data = new Map<
    string,
    { sum: number; count: number; values: number[] }
  >();
  readonly type: MetricType = 'summary';
  readonly percentiles: number[];
  private maxAge: number;
  private ageBuckets: number;
  private timestamps = new Map<string, number[]>();

  constructor(readonly options: SummaryOptions) {
    this.percentiles = options.percentiles ?? DEFAULT_PERCENTILES;
    this.maxAge = options.maxAge ?? 600000; // 10 minutes
    this.ageBuckets = options.ageBuckets ?? 5;
  }

  /**
   * Observe a value
   */
  observe(value: number, labels: Labels = {}): void {
    const key = this.labelsToKey(labels);
    let data = this.data.get(key);
    let timestamps = this.timestamps.get(key);

    if (!data) {
      data = { sum: 0, count: 0, values: [] };
      this.data.set(key, data);
      timestamps = [];
      this.timestamps.set(key, timestamps);
    }

    const now = Date.now();
    data.sum += value;
    data.count++;
    data.values.push(value);
    timestamps!.push(now);

    // Clean up old values
    this.cleanup(key);
  }

  /**
   * Time a function
   */
  time<T>(fn: () => T, labels: Labels = {}): T {
    const start = performance.now();
    try {
      return fn();
    } finally {
      const duration = (performance.now() - start) / 1000;
      this.observe(duration, labels);
    }
  }

  /**
   * Time an async function
   */
  async timeAsync<T>(fn: () => Promise<T>, labels: Labels = {}): Promise<T> {
    const start = performance.now();
    try {
      return await fn();
    } finally {
      const duration = (performance.now() - start) / 1000;
      this.observe(duration, labels);
    }
  }

  /**
   * Create a timer
   */
  startTimer(labels: Labels = {}): () => number {
    const start = performance.now();
    return () => {
      const duration = (performance.now() - start) / 1000;
      this.observe(duration, labels);
      return duration;
    };
  }

  /**
   * Get summary value
   */
  get(labels: Labels = {}): SummaryValue | undefined {
    const key = this.labelsToKey(labels);
    const data = this.data.get(key);

    if (!data) return undefined;

    const sorted = [...data.values].sort((a, b) => a - b);
    const quantiles = new Map<number, number>();

    for (const p of this.percentiles) {
      const index = Math.ceil(p * sorted.length) - 1;
      quantiles.set(p, sorted[Math.max(0, index)] ?? 0);
    }

    return {
      labels: this.keyToLabels(key),
      quantiles,
      sum: data.sum,
      count: data.count,
    };
  }

  /**
   * Get all summary values
   */
  getAll(): SummaryValue[] {
    return Array.from(this.data.keys()).map(key => {
      const labels = this.keyToLabels(key);
      return this.get(labels)!;
    });
  }

  /**
   * Reset summary
   */
  reset(labels?: Labels): void {
    if (labels) {
      const key = this.labelsToKey(labels);
      this.data.delete(key);
      this.timestamps.delete(key);
    } else {
      this.data.clear();
      this.timestamps.clear();
    }
  }

  private cleanup(key: string): void {
    const data = this.data.get(key);
    const timestamps = this.timestamps.get(key);
    if (!data || !timestamps) return;

    const now = Date.now();
    const cutoff = now - this.maxAge;

    let removeCount = 0;
    for (let i = 0; i < timestamps.length; i++) {
      if (timestamps[i] < cutoff) {
        removeCount++;
      } else {
        break;
      }
    }

    if (removeCount > 0) {
      const removed = data.values.splice(0, removeCount);
      timestamps.splice(0, removeCount);
      data.count -= removeCount;
      data.sum -= removed.reduce((a, b) => a + b, 0);
    }
  }

  private labelsToKey(labels: Labels): string {
    const sorted = Object.keys(labels)
      .sort()
      .map(k => `${k}="${labels[k]}"`)
      .join(',');
    return sorted || '__default__';
  }

  private keyToLabels(key: string): Labels {
    if (key === '__default__') return {};
    const labels: Labels = {};
    const pairs = key.split(',');
    for (const pair of pairs) {
      const match = pair.match(/^([^=]+)="([^"]*)"$/);
      if (match) {
        labels[match[1]] = match[2];
      }
    }
    return labels;
  }
}

// ============================================================================
// Metrics Registry
// ============================================================================

/**
 * Registry for managing metrics
 */
export class MetricsRegistry {
  private counters = new Map<string, Counter>();
  private gauges = new Map<string, Gauge>();
  private histograms = new Map<string, Histogram>();
  private summaries = new Map<string, Summary>();

  /**
   * Create or get counter
   */
  counter(options: MetricOptions): Counter {
    const existing = this.counters.get(options.name);
    if (existing) return existing;

    const counter = new Counter(options);
    this.counters.set(options.name, counter);
    return counter;
  }

  /**
   * Create or get gauge
   */
  gauge(options: MetricOptions): Gauge {
    const existing = this.gauges.get(options.name);
    if (existing) return existing;

    const gauge = new Gauge(options);
    this.gauges.set(options.name, gauge);
    return gauge;
  }

  /**
   * Create or get histogram
   */
  histogram(options: HistogramOptions): Histogram {
    const existing = this.histograms.get(options.name);
    if (existing) return existing;

    const histogram = new Histogram(options);
    this.histograms.set(options.name, histogram);
    return histogram;
  }

  /**
   * Create or get summary
   */
  summary(options: SummaryOptions): Summary {
    const existing = this.summaries.get(options.name);
    if (existing) return existing;

    const summary = new Summary(options);
    this.summaries.set(options.name, summary);
    return summary;
  }

  /**
   * Get all metrics
   */
  getMetrics(): {
    counters: Counter[];
    gauges: Gauge[];
    histograms: Histogram[];
    summaries: Summary[];
  } {
    return {
      counters: Array.from(this.counters.values()),
      gauges: Array.from(this.gauges.values()),
      histograms: Array.from(this.histograms.values()),
      summaries: Array.from(this.summaries.values()),
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    this.summaries.clear();
  }

  /**
   * Export metrics as JSON
   */
  toJSON(): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [name, counter] of this.counters) {
      result[name] = {
        type: 'counter',
        help: counter.options.help,
        values: counter.getAll(),
      };
    }

    for (const [name, gauge] of this.gauges) {
      result[name] = {
        type: 'gauge',
        help: gauge.options.help,
        values: gauge.getAll(),
      };
    }

    for (const [name, histogram] of this.histograms) {
      result[name] = {
        type: 'histogram',
        help: histogram.options.help,
        buckets: histogram.buckets,
        values: histogram.getAll(),
      };
    }

    for (const [name, summary] of this.summaries) {
      result[name] = {
        type: 'summary',
        help: summary.options.help,
        percentiles: summary.percentiles,
        values: summary.getAll().map(v => ({
          ...v,
          quantiles: Object.fromEntries(v.quantiles),
        })),
      };
    }

    return result;
  }

  /**
   * Export metrics in Prometheus format
   */
  toPrometheus(): string {
    const lines: string[] = [];

    for (const [name, counter] of this.counters) {
      if (counter.options.help) {
        lines.push(`# HELP ${name} ${counter.options.help}`);
      }
      lines.push(`# TYPE ${name} counter`);
      for (const value of counter.getAll()) {
        const labelsStr = this.formatLabels(value.labels);
        lines.push(`${name}${labelsStr} ${value.value}`);
      }
    }

    for (const [name, gauge] of this.gauges) {
      if (gauge.options.help) {
        lines.push(`# HELP ${name} ${gauge.options.help}`);
      }
      lines.push(`# TYPE ${name} gauge`);
      for (const value of gauge.getAll()) {
        const labelsStr = this.formatLabels(value.labels);
        lines.push(`${name}${labelsStr} ${value.value}`);
      }
    }

    for (const [name, histogram] of this.histograms) {
      if (histogram.options.help) {
        lines.push(`# HELP ${name} ${histogram.options.help}`);
      }
      lines.push(`# TYPE ${name} histogram`);
      for (const value of histogram.getAll()) {
        for (const bucket of value.buckets) {
          const labels = {
            ...value.labels,
            le: String(bucket.le === Infinity ? '+Inf' : bucket.le),
          };
          const labelsStr = this.formatLabels(labels);
          lines.push(`${name}_bucket${labelsStr} ${bucket.count}`);
        }
        const labelsStr = this.formatLabels(value.labels);
        lines.push(`${name}_sum${labelsStr} ${value.sum}`);
        lines.push(`${name}_count${labelsStr} ${value.count}`);
      }
    }

    for (const [name, summary] of this.summaries) {
      if (summary.options.help) {
        lines.push(`# HELP ${name} ${summary.options.help}`);
      }
      lines.push(`# TYPE ${name} summary`);
      for (const value of summary.getAll()) {
        for (const [quantile, val] of value.quantiles) {
          const labels = { ...value.labels, quantile: String(quantile) };
          const labelsStr = this.formatLabels(labels);
          lines.push(`${name}${labelsStr} ${val}`);
        }
        const labelsStr = this.formatLabels(value.labels);
        lines.push(`${name}_sum${labelsStr} ${value.sum}`);
        lines.push(`${name}_count${labelsStr} ${value.count}`);
      }
    }

    return lines.join('\n');
  }

  private formatLabels(labels: Labels): string {
    const pairs = Object.entries(labels);
    if (pairs.length === 0) return '';
    return `{${pairs.map(([k, v]) => `${k}="${v}"`).join(',')}}`;
  }
}

// ============================================================================
// Default Registry
// ============================================================================

/**
 * Default metrics registry
 */
export const defaultRegistry = new MetricsRegistry();

// ============================================================================
// Timer Utilities
// ============================================================================

/**
 * Simple stopwatch
 */
export class Stopwatch {
  private startTime: number | null = null;
  private elapsed = 0;
  private running = false;

  /**
   * Start the stopwatch
   */
  start(): this {
    if (!this.running) {
      this.startTime = performance.now();
      this.running = true;
    }
    return this;
  }

  /**
   * Stop the stopwatch
   */
  stop(): this {
    if (this.running && this.startTime !== null) {
      this.elapsed += performance.now() - this.startTime;
      this.running = false;
      this.startTime = null;
    }
    return this;
  }

  /**
   * Reset the stopwatch
   */
  reset(): this {
    this.elapsed = 0;
    this.startTime = null;
    this.running = false;
    return this;
  }

  /**
   * Get elapsed time in milliseconds
   */
  getElapsed(): number {
    if (this.running && this.startTime !== null) {
      return this.elapsed + (performance.now() - this.startTime);
    }
    return this.elapsed;
  }

  /**
   * Get elapsed time in seconds
   */
  getElapsedSeconds(): number {
    return this.getElapsed() / 1000;
  }

  /**
   * Check if running
   */
  isRunning(): boolean {
    return this.running;
  }
}

/**
 * Create a stopwatch
 */
export function stopwatch(): Stopwatch {
  return new Stopwatch();
}

/**
 * Time a function execution
 */
export function measureTime<T>(fn: () => T): { result: T; duration: number } {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  return { result, duration };
}

/**
 * Time an async function execution
 */
export async function measureTimeAsync<T>(
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  return { result, duration };
}

// ============================================================================
// Rate Calculation
// ============================================================================

/**
 * Rate calculator
 */
export class RateCalculator {
  private timestamps: number[] = [];
  private windowMs: number;

  constructor(windowMs = 60000) {
    this.windowMs = windowMs;
  }

  /**
   * Record an event
   */
  record(): void {
    const now = Date.now();
    this.timestamps.push(now);
    this.cleanup(now);
  }

  /**
   * Get rate per second
   */
  getRate(): number {
    const now = Date.now();
    this.cleanup(now);
    const windowSeconds = this.windowMs / 1000;
    return this.timestamps.length / windowSeconds;
  }

  /**
   * Get count in window
   */
  getCount(): number {
    const now = Date.now();
    this.cleanup(now);
    return this.timestamps.length;
  }

  /**
   * Reset calculator
   */
  reset(): void {
    this.timestamps = [];
  }

  private cleanup(now: number): void {
    const cutoff = now - this.windowMs;
    while (this.timestamps.length > 0 && this.timestamps[0] < cutoff) {
      this.timestamps.shift();
    }
  }
}

/**
 * Create rate calculator
 */
export function rateCalculator(windowMs = 60000): RateCalculator {
  return new RateCalculator(windowMs);
}

// ============================================================================
// Moving Average
// ============================================================================

/**
 * Moving average calculator
 */
export class MovingAverage {
  private values: number[] = [];
  private windowSize: number;

  constructor(windowSize = 10) {
    this.windowSize = windowSize;
  }

  /**
   * Add a value
   */
  add(value: number): void {
    this.values.push(value);
    if (this.values.length > this.windowSize) {
      this.values.shift();
    }
  }

  /**
   * Get average
   */
  getAverage(): number {
    if (this.values.length === 0) return 0;
    return this.values.reduce((a, b) => a + b, 0) / this.values.length;
  }

  /**
   * Get current count
   */
  getCount(): number {
    return this.values.length;
  }

  /**
   * Reset calculator
   */
  reset(): void {
    this.values = [];
  }
}

/**
 * Create moving average calculator
 */
export function movingAverage(windowSize = 10): MovingAverage {
  return new MovingAverage(windowSize);
}

/**
 * Exponential moving average
 */
export class ExponentialMovingAverage {
  private value: number | null = null;
  private alpha: number;

  constructor(alpha = 0.1) {
    if (alpha <= 0 || alpha > 1) {
      throw new Error('Alpha must be between 0 (exclusive) and 1 (inclusive)');
    }
    this.alpha = alpha;
  }

  /**
   * Add a value
   */
  add(value: number): void {
    if (this.value === null) {
      this.value = value;
    } else {
      this.value = this.alpha * value + (1 - this.alpha) * this.value;
    }
  }

  /**
   * Get average
   */
  getAverage(): number {
    return this.value ?? 0;
  }

  /**
   * Reset calculator
   */
  reset(): void {
    this.value = null;
  }
}

/**
 * Create exponential moving average calculator
 */
export function exponentialMovingAverage(
  alpha = 0.1
): ExponentialMovingAverage {
  return new ExponentialMovingAverage(alpha);
}

// ============================================================================
// Export Default
// ============================================================================

export const metrics = {
  // Classes
  Counter,
  Gauge,
  Histogram,
  Summary,
  MetricsRegistry,
  Stopwatch,
  RateCalculator,
  MovingAverage,
  ExponentialMovingAverage,

  // Constants
  DEFAULT_BUCKETS,
  DEFAULT_PERCENTILES,

  // Default registry
  defaultRegistry,

  // Helper functions
  stopwatch,
  measureTime,
  measureTimeAsync,
  rateCalculator,
  movingAverage,
  exponentialMovingAverage,
};
