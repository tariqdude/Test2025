import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  evaluateMetric,
  checkBundleSize,
  formatBytes,
  getPerformanceRecommendations,
  PerformanceMonitor,
  performanceBudgets,
  coreWebVitals,
} from '../config/performance-budgets';

describe('Performance Budgets', () => {
  describe('evaluateMetric', () => {
    it('should return good for values within good threshold', () => {
      expect(evaluateMetric('lcp', 2000)).toBe('good');
      expect(evaluateMetric('fid', 50)).toBe('good');
      expect(evaluateMetric('cls', 0.05)).toBe('good');
    });

    it('should return needs-improvement for values between good and needsImprovement', () => {
      expect(evaluateMetric('lcp', 3000)).toBe('needs-improvement');
      expect(evaluateMetric('fid', 200)).toBe('needs-improvement');
      expect(evaluateMetric('cls', 0.15)).toBe('needs-improvement');
    });

    it('should return poor for values above needsImprovement', () => {
      expect(evaluateMetric('lcp', 5000)).toBe('poor');
      expect(evaluateMetric('fid', 400)).toBe('poor');
      expect(evaluateMetric('cls', 0.3)).toBe('poor');
    });
  });

  describe('checkBundleSize', () => {
    it('should return withinBudget true if size is less than budget', () => {
      const result = checkBundleSize('javascript', 'main', 100 * 1024);
      expect(result.withinBudget).toBe(true);
      expect(result.excess).toBe(0);
    });

    it('should return withinBudget false if size exceeds budget', () => {
      const budget = performanceBudgets.javascript.main;
      const size = budget + 1024;
      const result = checkBundleSize('javascript', 'main', size);
      expect(result.withinBudget).toBe(false);
      expect(result.excess).toBe(1024);
    });
  });

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should respect decimals', () => {
      expect(formatBytes(1536, 2)).toBe('1.5 KB');
      expect(formatBytes(1536, 0)).toBe('2 KB');
    });
  });

  describe('getPerformanceRecommendations', () => {
    it('should return recommendations for exceeded budgets', () => {
      const metrics = {
        jsSize: performanceBudgets.javascript.total + 1024,
        cssSize: performanceBudgets.css.total + 1024,
        lcp: coreWebVitals.lcp.good + 100,
        fcp: coreWebVitals.fcp.good + 100,
        imageCount: 25,
      };

      const recommendations = getPerformanceRecommendations(metrics);
      expect(recommendations).toHaveLength(5);
      expect(recommendations[0]).toContain('JavaScript bundle exceeds budget');
      expect(recommendations[1]).toContain('CSS size exceeds budget');
      expect(recommendations[2]).toContain('LCP is');
      expect(recommendations[3]).toContain('FCP is');
      expect(recommendations[4]).toContain('Page has 25 images');
    });

    it('should return empty array if all metrics are good', () => {
      const metrics = {
        jsSize: 100,
        cssSize: 100,
        lcp: 100,
        fcp: 100,
        imageCount: 5,
      };

      const recommendations = getPerformanceRecommendations(metrics);
      expect(recommendations).toHaveLength(0);
    });
  });

  describe('PerformanceMonitor', () => {
    let monitor: PerformanceMonitor;

    beforeEach(() => {
      monitor = new PerformanceMonitor();
      vi.stubGlobal('performance', {
        mark: vi.fn(),
        measure: vi.fn(),
        getEntriesByName: vi.fn(),
        clearMarks: vi.fn(),
        clearMeasures: vi.fn(),
        timing: {
          domainLookupEnd: 10,
          domainLookupStart: 5,
          connectEnd: 20,
          connectStart: 10,
          responseStart: 30,
          requestStart: 20,
          responseEnd: 40,
          domContentLoadedEventStart: 50,
          domComplete: 60,
          domLoading: 40,
          loadEventEnd: 70,
          navigationStart: 0,
        },
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should mark performance', () => {
      monitor.mark('start');
      expect(performance.mark).toHaveBeenCalledWith('start');
    });

    it('should measure performance', () => {
      vi.mocked(performance.getEntriesByName).mockReturnValue([
        { duration: 100 } as PerformanceEntry,
      ]);

      const duration = monitor.measure('test', 'start', 'end');
      expect(performance.measure).toHaveBeenCalledWith('test', 'start', 'end');
      expect(duration).toBe(100);
      expect(monitor.getMetrics()).toEqual({ test: 100 });
    });

    it('should handle missing marks gracefully', () => {
      vi.mocked(performance.measure).mockImplementation(() => {
        throw new Error('Mark not found');
      });

      const duration = monitor.measure('test', 'start', 'end');
      expect(duration).toBeNull();
    });

    it('should clear metrics', () => {
      monitor.clear();
      expect(performance.clearMarks).toHaveBeenCalled();
      expect(performance.clearMeasures).toHaveBeenCalled();
      expect(monitor.getMetrics()).toEqual({});
    });

    it('should get navigation timing', () => {
      const timing = monitor.getNavigationTiming();
      expect(timing).toEqual({
        dns: 5,
        tcp: 10,
        request: 10,
        response: 10,
        domProcessing: 10,
        domComplete: 20,
        pageLoad: 70,
      });
    });
  });
});
