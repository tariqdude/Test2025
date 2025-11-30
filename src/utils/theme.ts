/**
 * Theme utilities
 */

import type { ColorScheme } from '../types/index';

/**
 * Detect user's preferred color scheme
 */
export const getPreferredColorScheme = (): ColorScheme => {
  if (typeof window === 'undefined') return 'light';

  const stored = localStorage.getItem('color-scheme') as ColorScheme;
  if (stored && ['light', 'dark', 'system'].includes(stored)) {
    return stored;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

/**
 * Apply color scheme to document
 */
export const applyColorScheme = (scheme: ColorScheme): void => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  if (scheme === 'system') {
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;
    root.classList.toggle('dark', prefersDark);
  } else {
    root.classList.toggle('dark', scheme === 'dark');
  }

  localStorage.setItem('color-scheme', scheme);
};
