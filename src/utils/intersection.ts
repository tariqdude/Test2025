/**
 * Intersection Observer Utilities
 * @module utils/intersection
 * @description High-level utilities for the Intersection Observer API
 * including lazy loading, infinite scroll, and visibility tracking.
 */

import { isBrowser } from './dom';

/**
 * Intersection observer options
 */
export interface IntersectionOptions {
  /** Element to use as viewport (default: browser viewport) */
  root?: Element | null;
  /** Margin around root (e.g., "10px 20px 30px 40px") */
  rootMargin?: string;
  /** Visibility threshold(s) to trigger callback (0-1) */
  threshold?: number | number[];
  /** Callback when element enters viewport */
  onEnter?: (entry: IntersectionObserverEntry) => void;
  /** Callback when element leaves viewport */
  onLeave?: (entry: IntersectionObserverEntry) => void;
  /** Unobserve after first intersection */
  once?: boolean;
}

/**
 * Lazy loading options
 */
export interface LazyLoadOptions {
  /** Root margin for early loading */
  rootMargin?: string;
  /** Attribute containing the source URL */
  srcAttr?: string;
  /** Attribute containing srcset */
  srcsetAttr?: string;
  /** Class to add while loading */
  loadingClass?: string;
  /** Class to add when loaded */
  loadedClass?: string;
  /** Class to add on error */
  errorClass?: string;
  /** Callback when image loads */
  onLoad?: (element: HTMLElement) => void;
  /** Callback on load error */
  onError?: (element: HTMLElement, error: Error) => void;
}

/**
 * Infinite scroll options
 */
export interface InfiniteScrollOptions {
  /** Element that triggers loading when visible */
  sentinel: HTMLElement;
  /** Function to load more content */
  loadMore: () => Promise<boolean | void>;
  /** Root margin for early triggering */
  rootMargin?: string;
  /** Throttle delay in ms */
  throttle?: number;
  /** Callback when loading starts */
  onLoadStart?: () => void;
  /** Callback when loading ends */
  onLoadEnd?: () => void;
}

/**
 * Observe an element's intersection with the viewport
 * @param element - Element to observe
 * @param options - Observer options
 * @returns Cleanup function
 * @example
 * const cleanup = observeIntersection(element, {
 *   onEnter: () => console.log('Visible'),
 *   onLeave: () => console.log('Hidden'),
 *   once: true, // Stop observing after first intersection
 * });
 */
export function observeIntersection(
  element: Element,
  options: IntersectionOptions = {}
): () => void {
  if (!isBrowser() || !('IntersectionObserver' in window)) {
    // Fallback: assume element is visible
    options.onEnter?.({} as IntersectionObserverEntry);
    return () => {};
  }

  const {
    root,
    rootMargin,
    threshold,
    onEnter,
    onLeave,
    once = false,
  } = options;

  const observer = new IntersectionObserver(
    entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          onEnter?.(entry);
          if (once) {
            observer.unobserve(element);
          }
        } else {
          onLeave?.(entry);
        }
      }
    },
    { root, rootMargin, threshold }
  );

  observer.observe(element);

  return () => {
    observer.unobserve(element);
    observer.disconnect();
  };
}

/**
 * Observe multiple elements at once
 * @param elements - Elements to observe
 * @param options - Observer options
 * @returns Cleanup function
 */
export function observeMany(
  elements: Element[] | NodeListOf<Element>,
  options: IntersectionOptions = {}
): () => void {
  if (!isBrowser() || !('IntersectionObserver' in window)) {
    return () => {};
  }

  const {
    root,
    rootMargin,
    threshold,
    onEnter,
    onLeave,
    once = false,
  } = options;
  const observedElements = new Set<Element>();

  const observer = new IntersectionObserver(
    entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          onEnter?.(entry);
          if (once) {
            observer.unobserve(entry.target);
            observedElements.delete(entry.target);
          }
        } else {
          onLeave?.(entry);
        }
      }
    },
    { root, rootMargin, threshold }
  );

  for (const element of elements) {
    observer.observe(element);
    observedElements.add(element);
  }

  return () => {
    for (const element of observedElements) {
      observer.unobserve(element);
    }
    observer.disconnect();
  };
}

/**
 * Create a visibility tracker that reports what percentage of viewport is visible
 * @param element - Element to track
 * @param callback - Called with visibility ratio (0-1)
 * @param options - Observer options
 */
export function trackVisibility(
  element: Element,
  callback: (ratio: number, entry: IntersectionObserverEntry) => void,
  options: {
    root?: Element | null;
    rootMargin?: string;
    steps?: number;
  } = {}
): () => void {
  const { root, rootMargin, steps = 20 } = options;

  // Create threshold array for smooth tracking
  const threshold = Array.from({ length: steps + 1 }, (_, i) => i / steps);

  return observeIntersection(element, {
    root,
    rootMargin,
    threshold,
    onEnter: entry => callback(entry.intersectionRatio, entry),
    onLeave: entry => callback(entry.intersectionRatio, entry),
  });
}

/**
 * Check if an element is currently in viewport
 * @param element - Element to check
 * @param threshold - Minimum visible ratio (0-1)
 */
export function isInViewport(element: Element, threshold = 0): boolean {
  if (!isBrowser()) return false;

  const rect = element.getBoundingClientRect();
  const windowHeight =
    window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;

  // Calculate visible area
  const visibleHeight =
    Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
  const visibleWidth =
    Math.min(rect.right, windowWidth) - Math.max(rect.left, 0);

  if (visibleHeight <= 0 || visibleWidth <= 0) return false;

  const visibleArea = visibleHeight * visibleWidth;
  const totalArea = rect.height * rect.width;
  const ratio = totalArea > 0 ? visibleArea / totalArea : 0;

  return ratio >= threshold;
}

/**
 * Wait for an element to become visible
 * @param element - Element to wait for
 * @param options - Wait options
 */
export function waitForVisible(
  element: Element,
  options: {
    threshold?: number;
    timeout?: number;
    rootMargin?: string;
  } = {}
): Promise<void> {
  const { threshold = 0, timeout = 30000, rootMargin } = options;

  return new Promise((resolve, reject) => {
    // Check if already visible
    if (isInViewport(element, threshold)) {
      resolve();
      return;
    }

    const timeoutId =
      timeout > 0
        ? setTimeout(() => {
            cleanup();
            reject(new Error('Timeout waiting for element to be visible'));
          }, timeout)
        : null;

    const cleanup = observeIntersection(element, {
      rootMargin,
      threshold,
      once: true,
      onEnter: () => {
        if (timeoutId) clearTimeout(timeoutId);
        resolve();
      },
    });
  });
}

/**
 * Create a lazy loader for images and iframes
 * @param options - Lazy load options
 * @example
 * const { observe, disconnect } = createLazyLoader({
 *   srcAttr: 'data-src',
 *   loadedClass: 'loaded',
 * });
 *
 * // Observe images
 * document.querySelectorAll('img[data-src]').forEach(observe);
 */
export function createLazyLoader(options: LazyLoadOptions = {}) {
  const {
    rootMargin = '50px',
    srcAttr = 'data-src',
    srcsetAttr = 'data-srcset',
    loadingClass = 'lazy-loading',
    loadedClass = 'lazy-loaded',
    errorClass = 'lazy-error',
    onLoad,
    onError,
  } = options;

  const observed = new Set<Element>();

  const loadElement = (element: HTMLElement) => {
    const src = element.getAttribute(srcAttr);
    const srcset = element.getAttribute(srcsetAttr);

    if (!src && !srcset) return;

    element.classList.add(loadingClass);

    const handleLoad = () => {
      element.classList.remove(loadingClass);
      element.classList.add(loadedClass);
      element.removeAttribute(srcAttr);
      element.removeAttribute(srcsetAttr);
      onLoad?.(element);
    };

    const handleError = () => {
      element.classList.remove(loadingClass);
      element.classList.add(errorClass);
      onError?.(element, new Error(`Failed to load: ${src}`));
    };

    if (element instanceof HTMLImageElement) {
      element.onload = handleLoad;
      element.onerror = handleError;
      if (srcset) element.srcset = srcset;
      if (src) element.src = src;
    } else if (element instanceof HTMLIFrameElement) {
      element.onload = handleLoad;
      element.onerror = handleError;
      if (src) element.src = src;
    } else if (element instanceof HTMLVideoElement) {
      element.onloadeddata = handleLoad;
      element.onerror = handleError;
      if (src) element.src = src;
    } else {
      // Background image
      if (src) {
        const img = new Image();
        img.onload = () => {
          element.style.backgroundImage = `url(${src})`;
          handleLoad();
        };
        img.onerror = handleError;
        img.src = src;
      }
    }
  };

  if (!isBrowser() || !('IntersectionObserver' in window)) {
    return {
      observe: (element: HTMLElement) => loadElement(element),
      unobserve: () => {},
      disconnect: () => {},
      getObserved: () => [],
    };
  }

  const observer = new IntersectionObserver(
    entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          loadElement(element);
          observer.unobserve(element);
          observed.delete(element);
        }
      }
    },
    { rootMargin }
  );

  return {
    /**
     * Start observing an element for lazy loading
     */
    observe(element: HTMLElement): void {
      if (!observed.has(element)) {
        observer.observe(element);
        observed.add(element);
      }
    },

    /**
     * Stop observing an element
     */
    unobserve(element: Element): void {
      observer.unobserve(element);
      observed.delete(element);
    },

    /**
     * Disconnect and stop all observations
     */
    disconnect(): void {
      observer.disconnect();
      observed.clear();
    },

    /**
     * Get all currently observed elements
     */
    getObserved(): Element[] {
      return Array.from(observed);
    },
  };
}

/**
 * Create an infinite scroll handler
 * @param options - Infinite scroll options
 * @example
 * const { start, stop, pause, resume } = createInfiniteScroll({
 *   sentinel: document.getElementById('load-more')!,
 *   loadMore: async () => {
 *     const hasMore = await fetchMoreData();
 *     return hasMore; // Return false to stop
 *   },
 * });
 *
 * start();
 */
export function createInfiniteScroll(options: InfiniteScrollOptions) {
  const {
    sentinel,
    loadMore,
    rootMargin = '100px',
    throttle = 500,
    onLoadStart,
    onLoadEnd,
  } = options;

  let isLoading = false;
  let isPaused = false;
  let hasMore = true;
  let lastLoadTime = 0;
  let cleanup: (() => void) | null = null;

  const triggerLoad = async () => {
    const now = Date.now();

    if (isLoading || isPaused || !hasMore) return;
    if (now - lastLoadTime < throttle) return;

    isLoading = true;
    lastLoadTime = now;
    onLoadStart?.();

    try {
      const result = await loadMore();
      // If loadMore returns false, stop loading more
      if (result === false) {
        hasMore = false;
      }
    } finally {
      isLoading = false;
      onLoadEnd?.();
    }
  };

  return {
    /**
     * Start observing the sentinel element
     */
    start(): void {
      if (cleanup) return;

      cleanup = observeIntersection(sentinel, {
        rootMargin,
        onEnter: () => triggerLoad(),
      });
    },

    /**
     * Stop observing and clean up
     */
    stop(): void {
      cleanup?.();
      cleanup = null;
      hasMore = true;
    },

    /**
     * Pause loading (keeps observer active)
     */
    pause(): void {
      isPaused = true;
    },

    /**
     * Resume loading
     */
    resume(): void {
      isPaused = false;
    },

    /**
     * Reset state and allow loading more
     */
    reset(): void {
      hasMore = true;
      isLoading = false;
      isPaused = false;
      lastLoadTime = 0;
    },

    /**
     * Check if currently loading
     */
    isLoading(): boolean {
      return isLoading;
    },

    /**
     * Check if has more content
     */
    hasMore(): boolean {
      return hasMore;
    },

    /**
     * Manually trigger a load
     */
    trigger(): Promise<void> {
      return triggerLoad();
    },
  };
}

/**
 * Animate elements when they enter the viewport
 * @param selector - CSS selector for elements to animate
 * @param options - Animation options
 */
export function animateOnScroll(
  selector: string,
  options: {
    animationClass?: string;
    threshold?: number;
    rootMargin?: string;
    stagger?: number;
    once?: boolean;
  } = {}
): () => void {
  if (!isBrowser()) return () => {};

  const {
    animationClass = 'animate-in',
    threshold = 0.1,
    rootMargin = '0px',
    stagger = 0,
    once = true,
  } = options;

  const elements = document.querySelectorAll(selector);
  const cleanups: Array<() => void> = [];

  let index = 0;

  for (const element of elements) {
    const currentIndex = index++;

    const cleanup = observeIntersection(element, {
      threshold,
      rootMargin,
      once,
      onEnter: () => {
        if (stagger > 0) {
          setTimeout(() => {
            element.classList.add(animationClass);
          }, currentIndex * stagger);
        } else {
          element.classList.add(animationClass);
        }
      },
      onLeave: () => {
        if (!once) {
          element.classList.remove(animationClass);
        }
      },
    });

    cleanups.push(cleanup);
  }

  return () => {
    cleanups.forEach(fn => fn());
  };
}
