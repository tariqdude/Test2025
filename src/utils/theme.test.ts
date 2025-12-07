import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getPreferredColorScheme, applyColorScheme } from './theme';

describe('Theme Utilities', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
    });
    vi.stubGlobal('window', {
      matchMedia: vi.fn().mockReturnValue({ matches: false }),
    });
    vi.stubGlobal('document', {
      documentElement: {
        classList: {
          toggle: vi.fn(),
        },
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getPreferredColorScheme', () => {
    it('should return stored preference if valid', () => {
      vi.mocked(localStorage.getItem).mockReturnValue('dark');
      expect(getPreferredColorScheme()).toBe('dark');
    });

    it('should return system preference if no stored preference', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);
      vi.mocked(window.matchMedia).mockReturnValue({
        matches: true,
      } as unknown as MediaQueryList);
      expect(getPreferredColorScheme()).toBe('dark');
    });

    it('should default to light if no preference and system is light', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);
      vi.mocked(window.matchMedia).mockReturnValue({
        matches: false,
      } as unknown as MediaQueryList);
      expect(getPreferredColorScheme()).toBe('light');
    });
  });

  describe('applyColorScheme', () => {
    it('should apply dark mode', () => {
      applyColorScheme('dark');
      expect(document.documentElement.classList.toggle).toHaveBeenCalledWith(
        'dark',
        true
      );
      expect(localStorage.setItem).toHaveBeenCalledWith('color-scheme', 'dark');
    });

    it('should apply light mode', () => {
      applyColorScheme('light');
      expect(document.documentElement.classList.toggle).toHaveBeenCalledWith(
        'dark',
        false
      );
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'color-scheme',
        'light'
      );
    });

    it('should apply system preference (dark)', () => {
      vi.mocked(window.matchMedia).mockReturnValue({
        matches: true,
      } as unknown as MediaQueryList);
      applyColorScheme('system');
      expect(document.documentElement.classList.toggle).toHaveBeenCalledWith(
        'dark',
        true
      );
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'color-scheme',
        'system'
      );
    });

    it('should apply system preference (light)', () => {
      vi.mocked(window.matchMedia).mockReturnValue({
        matches: false,
      } as unknown as MediaQueryList);
      applyColorScheme('system');
      expect(document.documentElement.classList.toggle).toHaveBeenCalledWith(
        'dark',
        false
      );
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'color-scheme',
        'system'
      );
    });
  });
});
