/**
 * Tests for network utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as network from './network';

describe('network utilities', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', {
      onLine: true,
      connection: {
        type: 'wifi',
        effectiveType: '4g',
        downlink: 10,
        rtt: 50,
        saveData: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('isOnline', () => {
    it('should return true when online', () => {
      expect(network.isOnline()).toBe(true);
    });

    it('should return false when offline', () => {
      vi.stubGlobal('navigator', { onLine: false });
      expect(network.isOnline()).toBe(false);
    });
  });

  describe('isOffline', () => {
    it('should return false when online', () => {
      expect(network.isOffline()).toBe(false);
    });

    it('should return true when offline', () => {
      vi.stubGlobal('navigator', { onLine: false });
      expect(network.isOffline()).toBe(true);
    });
  });

  describe('getNetworkInfo', () => {
    it('should return network information', () => {
      const info = network.getNetworkInfo();

      expect(info.online).toBe(true);
      expect(info.type).toBe('wifi');
      expect(info.effectiveType).toBe('4g');
      expect(info.downlink).toBe(10);
      expect(info.rtt).toBe(50);
      expect(info.saveData).toBe(false);
    });

    it('should return defaults when connection API unavailable', () => {
      vi.stubGlobal('navigator', { onLine: true });
      const info = network.getNetworkInfo();

      expect(info.online).toBe(true);
      expect(info.type).toBe('unknown');
      expect(info.effectiveType).toBe(null);
    });
  });

  describe('isSlowConnection', () => {
    it('should return false for fast connection', () => {
      expect(network.isSlowConnection()).toBe(false);
    });

    it('should return true for slow-2g', () => {
      vi.stubGlobal('navigator', {
        onLine: true,
        connection: {
          effectiveType: 'slow-2g',
        },
      });
      expect(network.isSlowConnection()).toBe(true);
    });

    it('should return true for 2g', () => {
      vi.stubGlobal('navigator', {
        onLine: true,
        connection: {
          effectiveType: '2g',
        },
      });
      expect(network.isSlowConnection()).toBe(true);
    });

    it('should return true for high RTT', () => {
      vi.stubGlobal('navigator', {
        onLine: true,
        connection: {
          effectiveType: '4g',
          rtt: 500,
        },
      });
      expect(network.isSlowConnection()).toBe(true);
    });

    it('should accept custom threshold', () => {
      vi.stubGlobal('navigator', {
        onLine: true,
        connection: {
          effectiveType: '4g',
          rtt: 100,
        },
      });
      expect(network.isSlowConnection(50)).toBe(true);
      expect(network.isSlowConnection(200)).toBe(false);
    });
  });

  describe('isDataSaverEnabled', () => {
    it('should return false when data saver is off', () => {
      expect(network.isDataSaverEnabled()).toBe(false);
    });

    it('should return true when data saver is on', () => {
      vi.stubGlobal('navigator', {
        onLine: true,
        connection: { saveData: true },
      });
      expect(network.isDataSaverEnabled()).toBe(true);
    });
  });

  describe('isMeteredConnection', () => {
    it('should return false for wifi', () => {
      expect(network.isMeteredConnection()).toBe(false);
    });

    it('should return true for cellular', () => {
      vi.stubGlobal('navigator', {
        onLine: true,
        connection: { type: 'cellular' },
      });
      expect(network.isMeteredConnection()).toBe(true);
    });
  });

  describe('onNetworkChange', () => {
    it('should subscribe to online/offline events', () => {
      const callback = vi.fn();
      const cleanup = network.onNetworkChange(callback);

      // Simulate online event
      window.dispatchEvent(new Event('online'));
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ online: true })
      );

      // Simulate offline event
      window.dispatchEvent(new Event('offline'));
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ online: false })
      );

      cleanup();
    });

    it('should clean up event listeners', () => {
      const callback = vi.fn();
      const cleanup = network.onNetworkChange(callback);
      cleanup();

      window.dispatchEvent(new Event('online'));
      // Callback should not be called after cleanup
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('waitForOnline', () => {
    it('should resolve immediately if already online', async () => {
      await expect(network.waitForOnline()).resolves.toBeUndefined();
    });

    it('should wait for online event', async () => {
      vi.stubGlobal('navigator', { onLine: false });

      const promise = network.waitForOnline(1000);

      // Simulate coming online
      setTimeout(() => {
        vi.stubGlobal('navigator', { onLine: true });
        window.dispatchEvent(new Event('online'));
      }, 10);

      await expect(promise).resolves.toBeUndefined();
    });

    it('should reject on timeout', async () => {
      vi.stubGlobal('navigator', { onLine: false });

      await expect(network.waitForOnline(50)).rejects.toThrow(
        'Timeout waiting for network'
      );
    });
  });

  describe('createOfflineFetch', () => {
    it('should throw when offline', async () => {
      vi.stubGlobal('navigator', { onLine: false });

      const offlineFetch = network.createOfflineFetch();

      await expect(offlineFetch('https://example.com')).rejects.toThrow(
        'Network unavailable'
      );
    });

    it('should call onOffline callback', async () => {
      vi.stubGlobal('navigator', { onLine: false });

      const onOffline = vi.fn();
      const offlineFetch = network.createOfflineFetch({ onOffline });

      await expect(offlineFetch('https://example.com')).rejects.toThrow();
      expect(onOffline).toHaveBeenCalledWith('https://example.com');
    });
  });

  describe('ping', () => {
    it('should return success on successful ping', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({}));

      const result = await network.ping('https://example.com');

      expect(result.success).toBe(true);
      expect(typeof result.latency).toBe('number');
    });

    it('should return failure on failed ping', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Failed')));

      const result = await network.ping('https://example.com');

      expect(result.success).toBe(false);
      expect(result.latency).toBe(null);
    });
  });

  describe('createNetworkMonitor', () => {
    it('should create a monitor', () => {
      const monitor = network.createNetworkMonitor();

      expect(monitor.isActive()).toBe(false);
      expect(typeof monitor.start).toBe('function');
      expect(typeof monitor.stop).toBe('function');
      expect(typeof monitor.measure).toBe('function');
    });

    it('should start and stop monitoring', () => {
      vi.useFakeTimers();
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({}));

      const monitor = network.createNetworkMonitor({ interval: 1000 });

      monitor.start();
      expect(monitor.isActive()).toBe(true);

      monitor.stop();
      expect(monitor.isActive()).toBe(false);

      vi.useRealTimers();
    });

    it('should call onUpdate with quality metrics', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({}));

      const onUpdate = vi.fn();
      const monitor = network.createNetworkMonitor({ onUpdate });

      const quality = await monitor.measure();

      expect(onUpdate).toHaveBeenCalled();
      expect(quality).toHaveProperty('latency');
      expect(quality).toHaveProperty('score');
      expect(quality).toHaveProperty('timestamp');
    });
  });
});
