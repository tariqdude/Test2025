// Performance optimization configuration for Astro

import { logger } from '../utils/logger';

const describeError = (error: unknown): Record<string, unknown> => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return { error };
};

/* ==================== PERFORMANCE CONSTANTS ==================== */

export const PERFORMANCE_CONFIG = {
  // Critical Resource Priorities
  CRITICAL_RESOURCES: [
    'font-display',
    'preload-fonts',
    'critical-css',
    'above-fold-images',
  ],

  // Image Optimization Settings
  IMAGE_FORMATS: ['avif', 'webp', 'jpg', 'png'] as const,
  IMAGE_SIZES: [320, 640, 768, 1024, 1280, 1536, 1920] as const,
  IMAGE_QUALITY: {
    high: 90,
    medium: 75,
    low: 60,
  },

  // Caching Strategies
  CACHE_STRATEGIES: {
    static: 'max-age=31536000, immutable', // 1 year
    dynamic: 'max-age=3600, stale-while-revalidate=86400', // 1 hour
    api: 'max-age=300, stale-while-revalidate=600', // 5 minutes
  },

  // Bundle Optimization
  CHUNK_SPLITTING: {
    vendor: ['react', 'vue', 'svelte'],
    utils: ['lodash', 'date-fns', 'axios'],
    ui: ['@headlessui', '@heroicons'],
  },

  // Lazy Loading Thresholds
  LAZY_LOADING: {
    rootMargin: '50px',
    threshold: 0.1,
    enableNative: true,
  },

  // Critical CSS Configuration
  CRITICAL_CSS: {
    width: 1300,
    height: 900,
    timeout: 30000,
    ignore: ['@font-face', '@keyframes'],
  },
} as const;

/* ==================== PERFORMANCE METRICS ==================== */

export interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
  tti: number; // Time to Interactive
}

export class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: PerformanceObserver[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObservers();
    }
  }

  private initializeObservers(): void {
    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
            startTime: number;
          };
          this.metrics.lcp = lastEntry.startTime;
        });
        lcpObserver.observe({
          type: 'largest-contentful-paint',
          buffered: true,
        });
        this.observers.push(lcpObserver);
      } catch (error) {
        logger.warn('LCP observer not supported', {
          observer: 'lcp',
          ...describeError(error),
        });
      }

      // First Input Delay
      try {
        const fidObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (entry.entryType === 'first-input') {
              this.metrics.fid =
                (
                  entry as PerformanceEntry & {
                    processingStart: number;
                    startTime: number;
                  }
                ).processingStart - entry.startTime;
            }
          });
        });
        fidObserver.observe({ type: 'first-input', buffered: true });
        this.observers.push(fidObserver);
      } catch (error) {
        logger.warn('FID observer not supported', {
          observer: 'fid',
          ...describeError(error),
        });
      }

      // Cumulative Layout Shift
      try {
        const clsObserver = new PerformanceObserver(list => {
          let clsValue = 0;
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (
              entry.entryType === 'layout-shift' &&
              !(entry as PerformanceEntry & { hadRecentInput: boolean })
                .hadRecentInput
            ) {
              clsValue += (entry as PerformanceEntry & { value: number }).value;
            }
          });
          this.metrics.cls = clsValue;
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });
        this.observers.push(clsObserver);
      } catch (error) {
        logger.warn('CLS observer not supported', {
          observer: 'cls',
          ...describeError(error),
        });
      }
    }

    // Navigation Timing metrics
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;
      if (navigation) {
        this.metrics.ttfb = navigation.responseStart - navigation.fetchStart;
        this.metrics.fcp =
          navigation.domContentLoadedEventEnd - navigation.fetchStart;
      }
    }
  }

  public getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  public logMetrics(): void {
    logger.info('Performance metrics snapshot', {
      metrics: { ...this.metrics },
    });
  }

  public destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

/* ==================== RESOURCE OPTIMIZATION ==================== */

export interface ResourceHint {
  rel: 'preload' | 'prefetch' | 'preconnect' | 'dns-prefetch';
  href: string;
  as?: 'font' | 'image' | 'script' | 'style' | 'document';
  type?: string;
  crossOrigin?: 'anonymous' | 'use-credentials';
}

export class ResourceOptimizer {
  private static instance: ResourceOptimizer;
  private resourceHints: ResourceHint[] = [];

  public static getInstance(): ResourceOptimizer {
    if (!ResourceOptimizer.instance) {
      ResourceOptimizer.instance = new ResourceOptimizer();
    }
    return ResourceOptimizer.instance;
  }

  public addResourceHint(hint: ResourceHint): void {
    // Avoid duplicates
    const exists = this.resourceHints.some(
      existing => existing.rel === hint.rel && existing.href === hint.href
    );

    if (!exists) {
      this.resourceHints.push(hint);
    }
  }

  public getResourceHints(): ResourceHint[] {
    return [...this.resourceHints];
  }

  public generatePreloadLink(
    resource: string,
    type: ResourceHint['as']
  ): string {
    return `<link rel="preload" href="${resource}" as="${type}">`;
  }

  public generatePrefetchLink(resource: string): string {
    return `<link rel="prefetch" href="${resource}">`;
  }

  public generatePreconnectLink(origin: string): string {
    return `<link rel="preconnect" href="${origin}">`;
  }
}

/* ==================== IMAGE OPTIMIZATION ==================== */

export interface ImageOptimizationOptions {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  sizes?: string;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
  fetchPriority?: 'high' | 'low' | 'auto';
  quality?: keyof typeof PERFORMANCE_CONFIG.IMAGE_QUALITY;
}

export class ImageOptimizer {
  public static generateSrcSet(
    baseSrc: string,
    widths: readonly number[] = PERFORMANCE_CONFIG.IMAGE_SIZES
  ): string {
    return widths
      .map(width => {
        const optimizedSrc = baseSrc.replace(
          /\.(jpg|jpeg|png|webp)$/i,
          `_${width}w.$1`
        );
        return `${optimizedSrc} ${width}w`;
      })
      .join(', ');
  }

  public static generateSizes(breakpoints: Record<string, string>): string {
    const entries = Object.entries(breakpoints);
    const mediaQueries = entries
      .slice(0, -1)
      .map(([breakpoint, size]) => `(max-width: ${breakpoint}) ${size}`)
      .join(', ');

    const fallback = entries[entries.length - 1][1];
    return mediaQueries ? `${mediaQueries}, ${fallback}` : fallback;
  }

  public static generateOptimizedImageProps(options: ImageOptimizationOptions) {
    const {
      src,
      alt,
      width,
      height,
      sizes = '100vw',
      loading = 'lazy',
      decoding = 'async',
      fetchPriority = 'auto',
    } = options;

    return {
      src,
      alt,
      width,
      height,
      sizes,
      loading,
      decoding,
      fetchpriority: fetchPriority,
      srcset: this.generateSrcSet(src),
      style: {
        aspectRatio: width && height ? `${width} / ${height}` : undefined,
      },
    };
  }
}

/* ==================== LAZY LOADING UTILITIES ==================== */

export class LazyLoader {
  private observer: IntersectionObserver | null = null;
  private elements: Set<Element> = new Set();

  constructor(
    options: IntersectionObserverInit = PERFORMANCE_CONFIG.LAZY_LOADING
  ) {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadElement(entry.target);
            this.observer?.unobserve(entry.target);
            this.elements.delete(entry.target);
          }
        });
      }, options);
    }
  }

  public observe(element: Element): void {
    if (this.observer && !this.elements.has(element)) {
      this.observer.observe(element);
      this.elements.add(element);
    }
  }

  public unobserve(element: Element): void {
    if (this.observer && this.elements.has(element)) {
      this.observer.unobserve(element);
      this.elements.delete(element);
    }
  }

  private loadElement(element: Element): void {
    if (element.hasAttribute('data-src')) {
      const src = element.getAttribute('data-src');
      if (src) {
        element.setAttribute('src', src);
        element.removeAttribute('data-src');
      }
    }

    if (element.hasAttribute('data-srcset')) {
      const srcset = element.getAttribute('data-srcset');
      if (srcset) {
        element.setAttribute('srcset', srcset);
        element.removeAttribute('data-srcset');
      }
    }

    // Add loaded class for CSS transitions
    element.classList.add('lazy-loaded');
  }

  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.elements.clear();
  }
}

/* ==================== CRITICAL CSS EXTRACTION ==================== */

export interface CriticalCSSOptions {
  html: string;
  css: string;
  width?: number;
  height?: number;
  timeout?: number;
  ignore?: string[];
}

export class CriticalCSSExtractor {
  public static async extract(options: CriticalCSSOptions): Promise<string> {
    const {
      html,
      css,
      ignore = PERFORMANCE_CONFIG.CRITICAL_CSS.ignore,
    } = options;

    // This is a simplified implementation
    // In a real-world scenario, you'd use a library like 'critical' or 'penthouse'
    try {
      // Extract above-the-fold CSS rules
      const criticalSelectors = this.extractCriticalSelectors(html);
      const criticalCSS = this.filterCSSRules(css, criticalSelectors, [
        ...ignore,
      ]);

      return criticalCSS;
    } catch (error) {
      logger.error(
        'Critical CSS extraction failed',
        error instanceof Error ? error : undefined,
        {
          stage: 'critical-css-extraction',
          ...describeError(error),
        }
      );
      return '';
    }
  }

  private static extractCriticalSelectors(html: string): string[] {
    const selectors: string[] = [];

    // Extract class names from HTML
    const classMatches = html.match(/class="([^"]+)"/g) || [];
    classMatches.forEach(match => {
      const classes = match.replace(/class="([^"]+)"/, '$1').split(/\s+/);
      classes.forEach(cls => {
        if (cls) selectors.push(`.${cls}`);
      });
    });

    // Extract IDs from HTML
    const idMatches = html.match(/id="([^"]+)"/g) || [];
    idMatches.forEach(match => {
      const id = match.replace(/id="([^"]+)"/, '$1');
      if (id) selectors.push(`#${id}`);
    });

    // Add common elements
    selectors.push('html', 'body', 'h1', 'h2', 'h3', 'p', 'a');

    return selectors;
  }

  private static filterCSSRules(
    css: string,
    selectors: string[],
    ignore: string[]
  ): string {
    const lines = css.split('\n');
    const criticalLines: string[] = [];
    let inCriticalRule = false;
    let braceDepth = 0;

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Skip ignored patterns
      if (ignore.some(pattern => trimmedLine.includes(pattern))) {
        continue;
      }

      // Check if this line starts a rule we care about
      if (!inCriticalRule && trimmedLine.includes('{')) {
        const selectorPart = trimmedLine.split('{')[0].trim();
        const isClientRule = selectors.some(selector =>
          selectorPart.includes(selector)
        );

        if (isClientRule) {
          inCriticalRule = true;
          criticalLines.push(line);
          braceDepth =
            (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
        }
      } else if (inCriticalRule) {
        criticalLines.push(line);
        braceDepth +=
          (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;

        if (braceDepth <= 0) {
          inCriticalRule = false;
          braceDepth = 0;
        }
      }
    }

    return criticalLines.join('\n');
  }
}

/* ==================== PERFORMANCE UTILITIES ==================== */

export const performanceUtils = {
  // Debounce function for performance-sensitive operations
  debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  // Throttle function for scroll/resize events
  throttle<T extends (...args: unknown[]) => unknown>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  // Measure performance of async operations
  async measureAsync<T>(
    operation: () => Promise<T>,
    label?: string
  ): Promise<{ result: T; duration: number }> {
    const start = performance.now();
    const result = await operation();
    const duration = performance.now() - start;

    if (label) {
      logger.debug('Async operation timing captured', {
        label,
        duration: Number(duration.toFixed(2)),
      });
    }

    return { result, duration };
  },

  // Check if device supports webp
  supportsWebP(): Promise<boolean> {
    return new Promise(resolve => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2);
      };
      webP.src =
        'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  },

  // Check if device supports avif
  supportsAVIF(): Promise<boolean> {
    return new Promise(resolve => {
      const avif = new Image();
      avif.onload = avif.onerror = () => {
        resolve(avif.height === 2);
      };
      avif.src =
        'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAABcAAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAAB9tZGF0EgAKCBgABogQEDQgMgkQAAAAB8dSLfI=';
    });
  },

  // Get optimal image format for current browser
  async getOptimalImageFormat(): Promise<'avif' | 'webp' | 'jpg'> {
    if (await this.supportsAVIF()) return 'avif';
    if (await this.supportsWebP()) return 'webp';
    return 'jpg';
  },

  // Preload critical resources
  preloadCriticalResources(resources: ResourceHint[]): void {
    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = resource.rel;
      link.href = resource.href;

      if (resource.as) link.as = resource.as;
      if (resource.type) link.type = resource.type;
      if (resource.crossOrigin) link.crossOrigin = resource.crossOrigin;

      document.head.appendChild(link);
    });
  },
};

/* ==================== DEFAULT EXPORTS ==================== */

// Create global instances
export const performanceMonitor = new PerformanceMonitor();
export const resourceOptimizer = ResourceOptimizer.getInstance();
export const imageOptimizer = ImageOptimizer;
export const criticalCSSExtractor = CriticalCSSExtractor;

// Auto-initialize performance monitoring in browser
if (typeof window !== 'undefined') {
  // Start performance monitoring
  // performanceMonitor is already initialized

  // Log metrics after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      performanceMonitor.logMetrics();
    }, 2000);
  });
}
