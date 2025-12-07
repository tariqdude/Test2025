import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Define types for the module
type AnimationsModule = typeof import('../../scripts/animations');

describe('Animations Script', () => {
  let animationsModule: AnimationsModule;

  beforeEach(async () => {
    // Reset modules to ensure fresh execution
    vi.resetModules();

    // Setup globals BEFORE importing the module
    vi.stubGlobal('window', {
      matchMedia: vi.fn().mockReturnValue({ matches: false }),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      scrollTo: vi.fn(),
      requestAnimationFrame: vi.fn((cb: FrameRequestCallback) =>
        setTimeout(() => cb(0), 0)
      ),
      innerHeight: 1000,
    });

    vi.stubGlobal('document', {
      querySelectorAll: vi.fn().mockReturnValue([]),
      querySelector: vi.fn(),
      addEventListener: vi.fn(),
      documentElement: {
        style: { setProperty: vi.fn() },
        clientHeight: 2000,
        scrollHeight: 3000,
      },
      body: {
        style: { setProperty: vi.fn() },
      },
      readyState: 'loading',
    });

    vi.stubGlobal(
      'IntersectionObserver',
      vi.fn().mockImplementation(function () {
        return {
          observe: vi.fn(),
          unobserve: vi.fn(),
          disconnect: vi.fn(),
        };
      })
    );

    // Dynamically import the module
    animationsModule = await import('../../scripts/animations');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('prefersReducedMotion', () => {
    it('should return true if media query matches', () => {
      vi.mocked(window.matchMedia).mockReturnValue({
        matches: true,
      } as unknown as MediaQueryList);
      expect(animationsModule.prefersReducedMotion()).toBe(true);
    });

    it('should return false if media query does not match', () => {
      vi.mocked(window.matchMedia).mockReturnValue({
        matches: false,
      } as unknown as MediaQueryList);
      expect(animationsModule.prefersReducedMotion()).toBe(false);
    });
  });

  describe('initializeAnimations', () => {
    it('should setup animations', () => {
      animationsModule.initializeAnimations();
      expect(IntersectionObserver).toHaveBeenCalled();
    });
  });

  describe('setAnimationConfig', () => {
    it('should update configuration', () => {
      expect(() =>
        animationsModule.setAnimationConfig({ duration: 1000 })
      ).not.toThrow();
    });
  });
});
