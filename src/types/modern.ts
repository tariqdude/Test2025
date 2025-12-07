/**
 * Modern TypeScript utility types and interfaces
 * @module types/modern
 */

// Utility types for better type safety
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

// Deep partial type for nested objects
export type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

// Deep readonly type
export type DeepReadonly<T> = T extends (infer R)[]
  ? DeepReadonlyArray<R>
  : T extends object
    ? DeepReadonlyObject<T>
    : T;

type DeepReadonlyArray<T> = readonly DeepReadonly<T>[];
type DeepReadonlyObject<T> = { readonly [P in keyof T]: DeepReadonly<T[P]> };

// Deep required type (opposite of DeepPartial)
export type DeepRequired<T> = T extends object
  ? { [P in keyof T]-?: DeepRequired<T[P]> }
  : T;

// Make specific keys required
export type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Make specific keys optional
export type OptionalKeys<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;

// Extract non-nullable keys
export type NonNullableKeys<T> = {
  [K in keyof T]-?: undefined extends T[K]
    ? never
    : null extends T[K]
      ? never
      : K;
}[keyof T];

// Record with required values
export type StrictRecord<K extends string | number | symbol, V> = {
  [P in K]: V;
};

// Mutable type (removes readonly)
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

// Deep mutable type
export type DeepMutable<T> = T extends (infer R)[]
  ? DeepMutable<R>[]
  : T extends object
    ? { -readonly [P in keyof T]: DeepMutable<T[P]> }
    : T;

// Get keys that are functions
export type FunctionKeys<T> = {
  [K in keyof T]: T[K] extends (...args: unknown[]) => unknown ? K : never;
}[keyof T];

// Get keys that are not functions (data keys)
export type DataKeys<T> = {
  [K in keyof T]: T[K] extends (...args: unknown[]) => unknown ? never : K;
}[keyof T];

// Awaited return type of async function
export type AwaitedReturn<T extends (...args: unknown[]) => unknown> = Awaited<
  ReturnType<T>
>;

// AsyncFunction type
export type AsyncFunction<T = void> = () => Promise<T>;
export type AsyncFunctionWithArgs<A extends unknown[], T = void> = (
  ...args: A
) => Promise<T>;

// Result type for error handling (inspired by Rust)
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

// Web Vitals metric type
export interface WebVitalMetric {
  name: 'CLS' | 'FCP' | 'LCP' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType:
    | 'navigate'
    | 'reload'
    | 'back-forward'
    | 'back-forward-cache'
    | 'prerender';
  entries: PerformanceEntry[];
}

// Navigation timing metrics
export interface NavigationTimingMetrics {
  dns: number;
  tcp: number;
  ttfb: number;
  download: number;
  domProcessing: number;
  total: number;
}

// Performance resource entry type
export interface PerformanceResourceEntry extends PerformanceEntry {
  transferSize: number;
  encodedBodySize: number;
  decodedBodySize: number;
  initiatorType: string;
}

// Paginate function type for Astro
export interface PaginateFunction<T> {
  (
    data: T[],
    options?: { pageSize?: number }
  ): Array<{
    params: { page: string | undefined };
    props: { page: import('astro').Page<T> };
  }>;
}
