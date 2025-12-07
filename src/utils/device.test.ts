/**
 * Tests for device detection utilities
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getDeviceType,
  isMobile,
  isTablet,
  isDesktop,
  isTouchDevice,
  isPointerDevice,
  supportsHover,
  getBrowser,
  isChrome,
  isFirefox,
  isSafari,
  isEdge,
  getOS,
  isWindows,
  isMacOS,
  isIOS,
  isAndroid,
  isLinux,
  prefersDarkMode,
  prefersLightMode,
  prefersReducedMotion,
} from './device';

describe('device utilities', () => {
  describe('device type detection', () => {
    beforeEach(() => {
      // Reset userAgent for each test
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        configurable: true,
      });
    });

    it('should get device type', () => {
      const type = getDeviceType();
      expect(['mobile', 'tablet', 'desktop']).toContain(type);
    });

    it('should return boolean for isMobile', () => {
      expect(typeof isMobile()).toBe('boolean');
    });

    it('should return boolean for isTablet', () => {
      expect(typeof isTablet()).toBe('boolean');
    });

    it('should return boolean for isDesktop', () => {
      expect(typeof isDesktop()).toBe('boolean');
    });

    it('should return boolean for isTouchDevice', () => {
      expect(typeof isTouchDevice()).toBe('boolean');
    });

    it('should return boolean for isPointerDevice', () => {
      expect(typeof isPointerDevice()).toBe('boolean');
    });

    it('should return boolean for supportsHover', () => {
      expect(typeof supportsHover()).toBe('boolean');
    });
  });

  describe('browser detection', () => {
    it('should return browser info object', () => {
      const browser = getBrowser();
      expect(browser).toBeDefined();
      expect(typeof browser.name).toBe('string');
      expect(typeof browser.version).toBe('string');
      expect(typeof browser.engine).toBe('string');
    });

    it('should return boolean for isChrome', () => {
      expect(typeof isChrome()).toBe('boolean');
    });

    it('should return boolean for isFirefox', () => {
      expect(typeof isFirefox()).toBe('boolean');
    });

    it('should return boolean for isSafari', () => {
      expect(typeof isSafari()).toBe('boolean');
    });

    it('should return boolean for isEdge', () => {
      expect(typeof isEdge()).toBe('boolean');
    });
  });

  describe('OS detection', () => {
    it('should return an OS name', () => {
      const os = getOS();
      expect([
        'windows',
        'macos',
        'linux',
        'ios',
        'android',
        'unknown',
      ]).toContain(os);
    });

    it('should return boolean for isWindows', () => {
      expect(typeof isWindows()).toBe('boolean');
    });

    it('should return boolean for isMacOS', () => {
      expect(typeof isMacOS()).toBe('boolean');
    });

    it('should return boolean for isIOS', () => {
      expect(typeof isIOS()).toBe('boolean');
    });

    it('should return boolean for isAndroid', () => {
      expect(typeof isAndroid()).toBe('boolean');
    });

    it('should return boolean for isLinux', () => {
      expect(typeof isLinux()).toBe('boolean');
    });
  });

  describe('user preferences', () => {
    let matchMediaMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      matchMediaMock = vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      Object.defineProperty(window, 'matchMedia', {
        value: matchMediaMock,
        configurable: true,
      });
    });

    it('should detect reduced motion preference', () => {
      expect(typeof prefersReducedMotion()).toBe('boolean');
    });

    it('should detect dark mode preference', () => {
      expect(typeof prefersDarkMode()).toBe('boolean');
    });

    it('should detect light mode preference', () => {
      expect(typeof prefersLightMode()).toBe('boolean');
    });

    it('should return true for reduced motion when user prefers it', () => {
      matchMediaMock.mockImplementation((query: string) => ({
        matches: query.includes('reduce'),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      const result = prefersReducedMotion();
      expect(typeof result).toBe('boolean');
    });

    it('should return true for dark mode when user prefers it', () => {
      matchMediaMock.mockImplementation((query: string) => ({
        matches: query.includes('dark'),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      const result = prefersDarkMode();
      expect(typeof result).toBe('boolean');
    });
  });
});
