/**
 * Network Status Utilities
 * @module utils/network
 * @description Monitor network connectivity, detect online/offline status,
 * measure connection quality, and handle offline scenarios.
 */

import { isBrowser } from './dom';

/**
 * Connection type enum
 */
export type ConnectionType =
  | 'bluetooth'
  | 'cellular'
  | 'ethernet'
  | 'wifi'
  | 'wimax'
  | 'other'
  | 'none'
  | 'unknown';

/**
 * Effective connection type (speed category)
 */
export type EffectiveType = 'slow-2g' | '2g' | '3g' | '4g';

/**
 * Network information
 */
export interface NetworkInfo {
  /** Whether the browser is online */
  online: boolean;
  /** Connection type */
  type: ConnectionType;
  /** Effective connection type (speed) */
  effectiveType: EffectiveType | null;
  /** Downlink speed in Mbps */
  downlink: number | null;
  /** Round-trip time in ms */
  rtt: number | null;
  /** Whether data saver is enabled */
  saveData: boolean;
}

/**
 * Network status change event
 */
export interface NetworkStatusEvent {
  online: boolean;
  timestamp: number;
  info: NetworkInfo;
}

type NetworkListener = (event: NetworkStatusEvent) => void;

/**
 * Check if currently online
 */
export function isOnline(): boolean {
  if (!isBrowser()) return true;
  return navigator.onLine;
}

/**
 * Check if currently offline
 */
export function isOffline(): boolean {
  return !isOnline();
}

/**
 * Get current network information
 */
export function getNetworkInfo(): NetworkInfo {
  if (!isBrowser()) {
    return {
      online: true,
      type: 'unknown',
      effectiveType: null,
      downlink: null,
      rtt: null,
      saveData: false,
    };
  }

  const connection = getNetworkConnection();

  return {
    online: navigator.onLine,
    type: connection?.type ?? 'unknown',
    effectiveType: connection?.effectiveType ?? null,
    downlink: connection?.downlink ?? null,
    rtt: connection?.rtt ?? null,
    saveData: connection?.saveData ?? false,
  };
}

/**
 * Check if on a slow connection
 * @param threshold - RTT threshold in ms (default: 300)
 */
export function isSlowConnection(threshold = 300): boolean {
  const info = getNetworkInfo();

  // Check effective type
  if (info.effectiveType === 'slow-2g' || info.effectiveType === '2g') {
    return true;
  }

  // Check RTT
  if (info.rtt !== null && info.rtt > threshold) {
    return true;
  }

  return false;
}

/**
 * Check if data saver mode is enabled
 */
export function isDataSaverEnabled(): boolean {
  return getNetworkInfo().saveData;
}

/**
 * Check if on metered connection (cellular)
 */
export function isMeteredConnection(): boolean {
  const type = getNetworkInfo().type;
  return type === 'cellular';
}

/**
 * Subscribe to network status changes
 * @param callback - Function called when network status changes
 * @returns Cleanup function
 * @example
 * const unsubscribe = onNetworkChange((event) => {
 *   console.log(event.online ? 'Online' : 'Offline');
 * });
 */
export function onNetworkChange(callback: NetworkListener): () => void {
  if (!isBrowser()) return () => {};

  const handleOnline = () => {
    callback({
      online: true,
      timestamp: Date.now(),
      info: getNetworkInfo(),
    });
  };

  const handleOffline = () => {
    callback({
      online: false,
      timestamp: Date.now(),
      info: getNetworkInfo(),
    });
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Also listen for connection changes if available
  const connection = getNetworkConnection();
  const handleConnectionChange = () => {
    callback({
      online: navigator.onLine,
      timestamp: Date.now(),
      info: getNetworkInfo(),
    });
  };

  connection?.addEventListener?.('change', handleConnectionChange);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    connection?.removeEventListener?.('change', handleConnectionChange);
  };
}

/**
 * Wait for network to come online
 * @param timeout - Maximum time to wait in ms (default: 30000)
 * @returns Promise that resolves when online or rejects on timeout
 */
export function waitForOnline(timeout = 30000): Promise<void> {
  if (isOnline()) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Timeout waiting for network'));
    }, timeout);

    const cleanup = onNetworkChange(event => {
      if (event.online) {
        clearTimeout(timer);
        cleanup();
        resolve();
      }
    });
  });
}

/**
 * Create an offline-aware fetch wrapper
 * @param options - Configuration options
 */
export function createOfflineFetch(
  options: {
    /** Called when a request fails due to offline */
    onOffline?: (request: RequestInfo) => void;
    /** Called when coming back online */
    onOnline?: () => void;
    /** Queue requests when offline */
    queueWhenOffline?: boolean;
  } = {}
) {
  const { onOffline, onOnline, queueWhenOffline = false } = options;
  const requestQueue: Array<{
    input: RequestInfo | URL;
    init?: RequestInit;
    resolve: (response: Response) => void;
    reject: (error: Error) => void;
  }> = [];

  // Process queue when online
  if (queueWhenOffline && isBrowser()) {
    onNetworkChange(event => {
      if (event.online) {
        onOnline?.();
        // Process queued requests
        while (requestQueue.length > 0) {
          const request = requestQueue.shift()!;
          fetch(request.input, request.init)
            .then(request.resolve)
            .catch(request.reject);
        }
      }
    });
  }

  return async function offlineFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    if (isOffline()) {
      onOffline?.(input as RequestInfo);

      if (queueWhenOffline) {
        return new Promise((resolve, reject) => {
          requestQueue.push({ input, init, resolve, reject });
        });
      }

      throw new Error('Network unavailable');
    }

    try {
      return await fetch(input, init);
    } catch (error) {
      // Check if it's a network error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        onOffline?.(input as RequestInfo);

        if (queueWhenOffline) {
          return new Promise((resolve, reject) => {
            requestQueue.push({ input, init, resolve, reject });
          });
        }
      }

      throw error;
    }
  };
}

/**
 * Ping a URL to check connectivity
 * @param url - URL to ping
 * @param timeout - Timeout in ms (default: 5000)
 */
export async function ping(
  url: string,
  timeout = 5000
): Promise<{
  success: boolean;
  latency: number | null;
}> {
  const start = performance.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const latency = Math.round(performance.now() - start);

    return { success: true, latency };
  } catch {
    return { success: false, latency: null };
  }
}

/**
 * Check actual internet connectivity (not just network interface)
 * @param urls - URLs to check (defaults to common endpoints)
 */
export async function checkInternetConnectivity(
  urls = ['https://www.google.com', 'https://www.cloudflare.com']
): Promise<boolean> {
  if (!isBrowser()) return true;

  // If browser says offline, trust it
  if (!navigator.onLine) return false;

  // Try to reach at least one URL
  const results = await Promise.allSettled(urls.map(url => ping(url, 3000)));

  return results.some(
    result => result.status === 'fulfilled' && result.value.success
  );
}

/**
 * Create a network quality monitor
 * @param options - Configuration options
 */
export function createNetworkMonitor(
  options: {
    /** Ping interval in ms (default: 30000) */
    interval?: number;
    /** URLs to ping for quality checks */
    urls?: string[];
    /** Callback for quality updates */
    onUpdate?: (quality: NetworkQuality) => void;
  } = {}
) {
  const {
    interval = 30000,
    urls = ['https://www.google.com'],
    onUpdate,
  } = options;

  let intervalId: ReturnType<typeof setInterval> | null = null;
  let samples: number[] = [];
  const maxSamples = 10;

  const measure = async (): Promise<NetworkQuality> => {
    const results = await Promise.all(urls.map(url => ping(url, 5000)));

    const successful = results.filter(r => r.success && r.latency !== null);
    const avgLatency =
      successful.length > 0
        ? successful.reduce((sum, r) => sum + r.latency!, 0) / successful.length
        : null;

    if (avgLatency !== null) {
      samples.push(avgLatency);
      if (samples.length > maxSamples) {
        samples.shift();
      }
    }

    const quality: NetworkQuality = {
      latency: avgLatency,
      jitter: calculateJitter(samples),
      packetLoss: 1 - successful.length / results.length,
      score: calculateQualityScore(
        avgLatency,
        samples,
        successful.length / results.length
      ),
      timestamp: Date.now(),
    };

    onUpdate?.(quality);
    return quality;
  };

  return {
    /**
     * Start monitoring
     */
    start(): void {
      if (intervalId) return;
      measure(); // Initial measurement
      intervalId = setInterval(measure, interval);
    },

    /**
     * Stop monitoring
     */
    stop(): void {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    },

    /**
     * Get current quality
     */
    async measure(): Promise<NetworkQuality> {
      return measure();
    },

    /**
     * Check if monitoring is active
     */
    isActive(): boolean {
      return intervalId !== null;
    },

    /**
     * Clear samples
     */
    reset(): void {
      samples = [];
    },
  };
}

/**
 * Network quality metrics
 */
export interface NetworkQuality {
  /** Average latency in ms */
  latency: number | null;
  /** Jitter (latency variation) in ms */
  jitter: number | null;
  /** Packet loss ratio (0-1) */
  packetLoss: number;
  /** Quality score (0-100) */
  score: number;
  /** Timestamp of measurement */
  timestamp: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

interface NetworkConnection extends EventTarget {
  type?: ConnectionType;
  effectiveType?: EffectiveType;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

function getNetworkConnection(): NetworkConnection | null {
  if (!isBrowser()) return null;

  const nav = navigator as Navigator & {
    connection?: NetworkConnection;
    mozConnection?: NetworkConnection;
    webkitConnection?: NetworkConnection;
  };

  return nav.connection || nav.mozConnection || nav.webkitConnection || null;
}

function calculateJitter(samples: number[]): number | null {
  if (samples.length < 2) return null;

  let totalDiff = 0;
  for (let i = 1; i < samples.length; i++) {
    totalDiff += Math.abs(samples[i] - samples[i - 1]);
  }

  return Math.round(totalDiff / (samples.length - 1));
}

function calculateQualityScore(
  latency: number | null,
  samples: number[],
  successRate: number
): number {
  let score = 100;

  // Deduct for latency
  if (latency !== null) {
    if (latency > 500) score -= 40;
    else if (latency > 300) score -= 30;
    else if (latency > 150) score -= 20;
    else if (latency > 50) score -= 10;
  }

  // Deduct for jitter
  const jitter = calculateJitter(samples);
  if (jitter !== null) {
    if (jitter > 100) score -= 20;
    else if (jitter > 50) score -= 10;
    else if (jitter > 20) score -= 5;
  }

  // Deduct for packet loss
  score -= (1 - successRate) * 30;

  return Math.max(0, Math.round(score));
}
