/**
 * Performance budgets and optimization configuration
 *
 * This file defines performance budgets for the application and provides
 * utilities for monitoring and enforcing them during development and build.
 */

/**
 * Performance budget thresholds (in bytes unless specified)
 */
export const performanceBudgets = {
  // JavaScript budgets
  javascript: {
    // Main bundle size limit
    main: 200 * 1024, // 200 KB
    // Vendor bundle size limit
    vendor: 300 * 1024, // 300 KB
    // Total JS budget
    total: 500 * 1024, // 500 KB
    // Individual chunk limit
    chunk: 150 * 1024, // 150 KB
  },

  // CSS budgets
  css: {
    // Main CSS file limit
    main: 50 * 1024, // 50 KB
    // Total CSS budget
    total: 100 * 1024, // 100 KB
    // Critical CSS limit (above-the-fold)
    critical: 14 * 1024, // 14 KB
  },

  // Image budgets
  images: {
    // Single image max size
    maxSize: 200 * 1024, // 200 KB
    // Total images on a page
    totalPerPage: 1024 * 1024, // 1 MB
  },

  // Font budgets
  fonts: {
    // Single font file
    maxSize: 100 * 1024, // 100 KB
    // Total fonts
    total: 300 * 1024, // 300 KB
  },

  // Total page weight
  pageWeight: {
    // Home page
    home: 1024 * 1024, // 1 MB
    // Blog post
    blogPost: 800 * 1024, // 800 KB
    // Other pages
    default: 1.5 * 1024 * 1024, // 1.5 MB
  },

  // Network timing budgets (in milliseconds)
  timing: {
    // Time to First Byte
    ttfb: 600,
    // First Contentful Paint
    fcp: 1800,
    // Largest Contentful Paint
    lcp: 2500,
    // Time to Interactive
    tti: 3800,
    // Total Blocking Time
    tbt: 300,
    // Cumulative Layout Shift (score, not ms)
    cls: 0.1,
    // First Input Delay
    fid: 100,
  },
};

/**
 * Core Web Vitals thresholds
 */
export const coreWebVitals = {
  lcp: {
    good: 2500,
    needsImprovement: 4000,
  },
  fid: {
    good: 100,
    needsImprovement: 300,
  },
  cls: {
    good: 0.1,
    needsImprovement: 0.25,
  },
  fcp: {
    good: 1800,
    needsImprovement: 3000,
  },
  ttfb: {
    good: 800,
    needsImprovement: 1800,
  },
};

/**
 * Performance optimization strategies
 */
export const optimizationStrategies = {
  // Code splitting patterns
  codeSplitting: {
    routes: true, // Split by route
    vendor: true, // Separate vendor bundle
    dynamic: true, // Dynamic imports for heavy components
  },

  // Asset optimization
  assets: {
    // Image formats to use
    imageFormats: ['webp', 'avif', 'jpg'],
    // Lazy loading strategy
    lazyLoad: {
      images: true,
      iframes: true,
      threshold: '50px', // Load when 50px from viewport
    },
    // Compression
    compression: {
      enabled: true,
      quality: 80, // 0-100
    },
  },

  // Caching strategy
  caching: {
    // Service worker caching
    serviceWorker: {
      enabled: false, // Static site, not needed
      strategy: 'network-first',
    },
    // Browser caching
    headers: {
      staticAssets: 'public, max-age=31536000, immutable',
      html: 'no-cache, no-store, must-revalidate',
      api: 'public, max-age=300', // 5 minutes
    },
  },

  // Resource hints
  resourceHints: {
    preconnect: ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'],
    dnsPrefetch: [],
    preload: [
      // Preload critical fonts
      { href: '/fonts/inter-var.woff2', as: 'font', type: 'font/woff2' },
    ],
  },

  // Tree shaking and minification
  build: {
    treeShaking: true,
    minify: true,
    sourceMaps: false, // Disable in production
    removeConsole: true, // Remove console.log in production
  },
};

/**
 * Performance monitoring configuration
 */
export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  threshold: {
    good: number;
    needsImprovement: number;
  };
}

/**
 * Evaluate a metric against Core Web Vitals thresholds
 */
export function evaluateMetric(
  metricName: keyof typeof coreWebVitals,
  value: number
): PerformanceMetric['rating'] {
  const thresholds = coreWebVitals[metricName];
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.needsImprovement) return 'needs-improvement';
  return 'poor';
}

/**
 * Check if bundle size exceeds budget
 */
export function checkBundleSize(
  type: 'javascript' | 'css',
  category: string,
  size: number
): { withinBudget: boolean; budget: number; excess: number } {
  const budget =
    performanceBudgets[type][
      category as keyof (typeof performanceBudgets)[typeof type]
    ];
  const excess = size - budget;

  return {
    withinBudget: size <= budget,
    budget,
    excess: excess > 0 ? excess : 0,
  };
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return (
    parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i]
  );
}

/**
 * Performance recommendations based on metrics
 */
export function getPerformanceRecommendations(metrics: {
  jsSize?: number;
  cssSize?: number;
  imageCount?: number;
  lcp?: number;
  fcp?: number;
}): string[] {
  const recommendations: string[] = [];

  // JavaScript recommendations
  if (metrics.jsSize && metrics.jsSize > performanceBudgets.javascript.total) {
    recommendations.push(
      `JavaScript bundle exceeds budget by ${formatBytes(metrics.jsSize - performanceBudgets.javascript.total)}. Consider code splitting or removing unused dependencies.`
    );
  }

  // CSS recommendations
  if (metrics.cssSize && metrics.cssSize > performanceBudgets.css.total) {
    recommendations.push(
      `CSS size exceeds budget. Consider using CSS-in-JS with better tree-shaking or removing unused styles.`
    );
  }

  // LCP recommendations
  if (metrics.lcp && metrics.lcp > coreWebVitals.lcp.good) {
    recommendations.push(
      `LCP is ${metrics.lcp}ms (target: ${coreWebVitals.lcp.good}ms). Optimize largest element loading, consider preloading critical images.`
    );
  }

  // FCP recommendations
  if (metrics.fcp && metrics.fcp > coreWebVitals.fcp.good) {
    recommendations.push(
      `FCP is ${metrics.fcp}ms (target: ${coreWebVitals.fcp.good}ms). Reduce render-blocking resources and optimize critical CSS.`
    );
  }

  // Image recommendations
  if (metrics.imageCount && metrics.imageCount > 20) {
    recommendations.push(
      `Page has ${metrics.imageCount} images. Consider lazy loading and using modern image formats (WebP, AVIF).`
    );
  }

  return recommendations;
}

/**
 * Web performance API helper
 */
export class PerformanceMonitor {
  private metrics: Map<string, number> = new Map();

  /**
   * Mark the start of a performance measurement
   */
  mark(name: string): void {
    if (typeof performance !== 'undefined') {
      performance.mark(name);
    }
  }

  /**
   * Measure time between two marks
   */
  measure(name: string, startMark: string, endMark: string): number | null {
    if (typeof performance === 'undefined') return null;

    try {
      performance.measure(name, startMark, endMark);
      const entries = performance.getEntriesByName(name, 'measure');
      if (entries.length > 0) {
        const duration = entries[entries.length - 1].duration;
        this.metrics.set(name, duration);
        return duration;
      }
    } catch {
      // Mark doesn't exist
    }
    return null;
  }

  /**
   * Get all collected metrics
   */
  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  /**
   * Clear all marks and measures
   */
  clear(): void {
    if (typeof performance !== 'undefined') {
      performance.clearMarks();
      performance.clearMeasures();
    }
    this.metrics.clear();
  }

  /**
   * Get navigation timing metrics
   */
  getNavigationTiming(): Record<string, number> | null {
    if (typeof performance === 'undefined' || !performance.timing) {
      return null;
    }

    const timing = performance.timing;
    return {
      dns: timing.domainLookupEnd - timing.domainLookupStart,
      tcp: timing.connectEnd - timing.connectStart,
      request: timing.responseStart - timing.requestStart,
      response: timing.responseEnd - timing.responseStart,
      domProcessing: timing.domContentLoadedEventStart - timing.responseEnd,
      domComplete: timing.domComplete - timing.domLoading,
      pageLoad: timing.loadEventEnd - timing.navigationStart,
    };
  }
}

// Export default configuration
export default {
  performanceBudgets,
  coreWebVitals,
  optimizationStrategies,
  evaluateMetric,
  checkBundleSize,
  formatBytes,
  getPerformanceRecommendations,
  PerformanceMonitor,
};
