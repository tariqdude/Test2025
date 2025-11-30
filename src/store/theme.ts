import { atom } from 'nanostores';

export type Theme = 'ops-center' | 'corporate' | 'terminal';

export const theme = atom<Theme>('ops-center');

export function setTheme(newTheme: Theme) {
  theme.set(newTheme);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('theme', newTheme);
  }
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = newTheme;

    // Handle dark mode class for Tailwind
    if (newTheme === 'corporate') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  }
}

export function initializeTheme() {
  if (typeof localStorage !== 'undefined') {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // Default to ops-center (dark)
      setTheme('ops-center');
    }
  }
}
