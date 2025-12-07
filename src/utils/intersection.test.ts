/**
 * Tests for intersection utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as intersection from './intersection';

// Mock IntersectionObserver
class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  callback: IntersectionObserverCallback;
  options: IntersectionObserverInit | undefined;
  observed: Element[] = [];

  constructor(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit
  ) {
    this.callback = callback;
    this.options = options;
    MockIntersectionObserver.instances.push(this);
  }

  observe(element: Element) {
    this.observed.push(element);
  }

  unobserve(element: Element) {
    this.observed = this.observed.filter(el => el !== element);
  }

  disconnect() {
    this.observed = [];
  }

  // Helper to trigger intersection
  trigger(entries: Partial<IntersectionObserverEntry>[]) {
    const fullEntries = entries.map(entry => ({
      isIntersecting: entry.isIntersecting ?? false,
      intersectionRatio: entry.intersectionRatio ?? 0,
      target: entry.target ?? document.createElement('div'),
      boundingClientRect: entry.boundingClientRect ?? ({} as DOMRectReadOnly),
      intersectionRect: entry.intersectionRect ?? ({} as DOMRectReadOnly),
      rootBounds: entry.rootBounds ?? null,
      time: entry.time ?? Date.now(),
    })) as IntersectionObserverEntry[];

    this.callback(fullEntries, this as unknown as IntersectionObserver);
  }
}

describe('intersection utilities', () => {
  beforeEach(() => {
    MockIntersectionObserver.instances = [];
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('observeIntersection', () => {
    it('should observe element', () => {
      const element = document.createElement('div');
      const onEnter = vi.fn();

      intersection.observeIntersection(element, { onEnter });

      expect(MockIntersectionObserver.instances).toHaveLength(1);
      expect(MockIntersectionObserver.instances[0].observed).toContain(element);
    });

    it('should call onEnter when element intersects', () => {
      const element = document.createElement('div');
      const onEnter = vi.fn();

      intersection.observeIntersection(element, { onEnter });

      const observer = MockIntersectionObserver.instances[0];
      observer.trigger([{ isIntersecting: true, target: element }]);

      expect(onEnter).toHaveBeenCalled();
    });

    it('should call onLeave when element leaves viewport', () => {
      const element = document.createElement('div');
      const onLeave = vi.fn();

      intersection.observeIntersection(element, { onLeave });

      const observer = MockIntersectionObserver.instances[0];
      observer.trigger([{ isIntersecting: false, target: element }]);

      expect(onLeave).toHaveBeenCalled();
    });

    it('should unobserve after first intersection with once option', () => {
      const element = document.createElement('div');
      const onEnter = vi.fn();

      intersection.observeIntersection(element, { onEnter, once: true });

      const observer = MockIntersectionObserver.instances[0];
      observer.trigger([{ isIntersecting: true, target: element }]);

      expect(observer.observed).not.toContain(element);
    });

    it('should return cleanup function', () => {
      const element = document.createElement('div');
      const cleanup = intersection.observeIntersection(element, {});

      expect(typeof cleanup).toBe('function');

      cleanup();
      expect(MockIntersectionObserver.instances[0].observed).not.toContain(
        element
      );
    });
  });

  describe('observeMany', () => {
    it('should observe multiple elements', () => {
      const elements = [
        document.createElement('div'),
        document.createElement('div'),
        document.createElement('div'),
      ];

      intersection.observeMany(elements, {});

      expect(MockIntersectionObserver.instances[0].observed).toHaveLength(3);
    });

    it('should call onEnter for each intersecting element', () => {
      const elements = [
        document.createElement('div'),
        document.createElement('div'),
      ];
      const onEnter = vi.fn();

      intersection.observeMany(elements, { onEnter });

      const observer = MockIntersectionObserver.instances[0];
      observer.trigger([
        { isIntersecting: true, target: elements[0] },
        { isIntersecting: true, target: elements[1] },
      ]);

      expect(onEnter).toHaveBeenCalledTimes(2);
    });
  });

  describe('trackVisibility', () => {
    it('should track visibility ratio', () => {
      const element = document.createElement('div');
      const callback = vi.fn();

      intersection.trackVisibility(element, callback);

      const observer = MockIntersectionObserver.instances[0];

      // Should have multiple thresholds
      expect(observer.options?.threshold).toBeInstanceOf(Array);

      observer.trigger([{ isIntersecting: true, intersectionRatio: 0.5 }]);

      expect(callback).toHaveBeenCalledWith(
        0.5,
        expect.objectContaining({ intersectionRatio: 0.5 })
      );
    });
  });

  describe('isInViewport', () => {
    it('should return true when element is in viewport', () => {
      const element = document.createElement('div');

      // Mock getBoundingClientRect
      vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
        top: 100,
        bottom: 200,
        left: 100,
        right: 200,
        width: 100,
        height: 100,
        x: 100,
        y: 100,
        toJSON: () => {},
      });

      expect(intersection.isInViewport(element)).toBe(true);
    });

    it('should return false when element is above viewport', () => {
      const element = document.createElement('div');

      vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
        top: -200,
        bottom: -100,
        left: 100,
        right: 200,
        width: 100,
        height: 100,
        x: 100,
        y: -200,
        toJSON: () => {},
      });

      expect(intersection.isInViewport(element)).toBe(false);
    });

    it('should check threshold', () => {
      const element = document.createElement('div');

      vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
        top: 600,
        bottom: 800,
        left: 100,
        right: 200,
        width: 100,
        height: 200,
        x: 100,
        y: 600,
        toJSON: () => {},
      });

      // Only partially visible (innerHeight is typically 768 in JSDOM)
      expect(intersection.isInViewport(element, 0)).toBe(true);
      expect(intersection.isInViewport(element, 1)).toBe(false);
    });
  });

  describe('waitForVisible', () => {
    it('should resolve immediately if already visible', async () => {
      const element = document.createElement('div');

      vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
        top: 100,
        bottom: 200,
        left: 100,
        right: 200,
        width: 100,
        height: 100,
        x: 100,
        y: 100,
        toJSON: () => {},
      });

      await expect(
        intersection.waitForVisible(element)
      ).resolves.toBeUndefined();
    });

    it('should wait for element to become visible', async () => {
      const element = document.createElement('div');

      // Initially not visible
      vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
        top: -200,
        bottom: -100,
        left: 100,
        right: 200,
        width: 100,
        height: 100,
        x: 100,
        y: -200,
        toJSON: () => {},
      });

      const promise = intersection.waitForVisible(element);

      // Trigger visibility
      const observer = MockIntersectionObserver.instances[0];
      observer.trigger([{ isIntersecting: true, target: element }]);

      await expect(promise).resolves.toBeUndefined();
    });

    it('should reject on timeout', async () => {
      const element = document.createElement('div');

      vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
        top: -200,
        bottom: -100,
        left: 100,
        right: 200,
        width: 100,
        height: 100,
        x: 100,
        y: -200,
        toJSON: () => {},
      });

      await expect(
        intersection.waitForVisible(element, { timeout: 50 })
      ).rejects.toThrow('Timeout waiting for element to be visible');
    });
  });

  describe('createLazyLoader', () => {
    it('should create a lazy loader', () => {
      const loader = intersection.createLazyLoader();

      expect(loader.observe).toBeDefined();
      expect(loader.unobserve).toBeDefined();
      expect(loader.disconnect).toBeDefined();
      expect(loader.getObserved).toBeDefined();
    });

    it('should observe elements for lazy loading', () => {
      const loader = intersection.createLazyLoader();
      const img = document.createElement('img');
      img.setAttribute('data-src', 'https://example.com/image.jpg');

      loader.observe(img);

      expect(loader.getObserved()).toContain(img);
    });

    it('should load element when it becomes visible', () => {
      const onLoad = vi.fn();
      const loader = intersection.createLazyLoader({ onLoad });

      const img = document.createElement('img');
      img.setAttribute('data-src', 'https://example.com/image.jpg');

      loader.observe(img);

      // Trigger intersection
      const observer = MockIntersectionObserver.instances[0];
      observer.trigger([{ isIntersecting: true, target: img }]);

      expect(img.src).toBe('https://example.com/image.jpg');
    });

    it('should disconnect all observers', () => {
      const loader = intersection.createLazyLoader();
      const img = document.createElement('img');

      loader.observe(img);
      loader.disconnect();

      expect(loader.getObserved()).toHaveLength(0);
    });
  });

  describe('createInfiniteScroll', () => {
    it('should create infinite scroll handler', () => {
      const sentinel = document.createElement('div');
      const loadMore = vi.fn().mockResolvedValue(true);

      const scroll = intersection.createInfiniteScroll({ sentinel, loadMore });

      expect(scroll.start).toBeDefined();
      expect(scroll.stop).toBeDefined();
      expect(scroll.pause).toBeDefined();
      expect(scroll.resume).toBeDefined();
    });

    it('should call loadMore when sentinel is visible', async () => {
      const sentinel = document.createElement('div');
      const loadMore = vi.fn().mockResolvedValue(true);

      const scroll = intersection.createInfiniteScroll({ sentinel, loadMore });
      scroll.start();

      // Trigger intersection
      const observer = MockIntersectionObserver.instances[0];
      observer.trigger([{ isIntersecting: true, target: sentinel }]);

      // Wait for async loadMore
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(loadMore).toHaveBeenCalled();
    });

    it('should stop loading when loadMore returns false', async () => {
      const sentinel = document.createElement('div');
      const loadMore = vi.fn().mockResolvedValue(false);

      const scroll = intersection.createInfiniteScroll({ sentinel, loadMore });
      scroll.start();

      // Trigger intersection
      const observer = MockIntersectionObserver.instances[0];
      observer.trigger([{ isIntersecting: true, target: sentinel }]);

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(scroll.hasMore()).toBe(false);
    });

    it('should pause and resume', async () => {
      const sentinel = document.createElement('div');
      const loadMore = vi.fn().mockResolvedValue(true);

      const scroll = intersection.createInfiniteScroll({ sentinel, loadMore });
      scroll.start();
      scroll.pause();

      // Trigger intersection
      const observer = MockIntersectionObserver.instances[0];
      observer.trigger([{ isIntersecting: true, target: sentinel }]);

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(loadMore).not.toHaveBeenCalled();

      scroll.resume();
      observer.trigger([{ isIntersecting: true, target: sentinel }]);

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(loadMore).toHaveBeenCalled();
    });
  });

  describe('animateOnScroll', () => {
    it('should setup animation observers', () => {
      document.body.innerHTML = `
        <div class="animate"></div>
        <div class="animate"></div>
      `;

      const cleanup = intersection.animateOnScroll('.animate');

      expect(MockIntersectionObserver.instances).toHaveLength(2);
      expect(typeof cleanup).toBe('function');

      cleanup();
    });

    it('should add animation class when element enters viewport', () => {
      document.body.innerHTML = '<div class="animate"></div>';

      intersection.animateOnScroll('.animate', {
        animationClass: 'fade-in',
      });

      const element = document.querySelector('.animate')!;
      const observer = MockIntersectionObserver.instances[0];
      observer.trigger([{ isIntersecting: true, target: element }]);

      expect(element.classList.contains('fade-in')).toBe(true);
    });

    it('should remove animation class when leaving with once=false', () => {
      document.body.innerHTML = '<div class="animate"></div>';

      intersection.animateOnScroll('.animate', {
        animationClass: 'fade-in',
        once: false,
      });

      const element = document.querySelector('.animate')!;
      const observer = MockIntersectionObserver.instances[0];

      observer.trigger([{ isIntersecting: true, target: element }]);
      expect(element.classList.contains('fade-in')).toBe(true);

      observer.trigger([{ isIntersecting: false, target: element }]);
      expect(element.classList.contains('fade-in')).toBe(false);
    });
  });
});
