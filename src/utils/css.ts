/**
 * CSS utilities
 */

/**
 * Combine CSS class names conditionally
 */
export const cn = (
  ...classes: (string | undefined | null | false)[]
): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Generate CSS variables object for dynamic theming
 */
export const cssVariables = (
  variables: Record<string, string | number>
): Record<string, string> => {
  const result: Record<string, string> = {};

  Object.entries(variables).forEach(([key, value]) => {
    result[`--${key}`] = String(value);
  });

  return result;
};

/**
 * Convert object to inline style string
 */
export const toStyleString = (
  styles: Record<string, string | number | undefined>
): string => {
  return Object.entries(styles)
    .filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
    .map(([key, value]) => {
      // Convert camelCase to kebab-case
      const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${kebabKey}: ${value}`;
    })
    .join('; ');
};

/**
 * Parse inline style string to object
 */
export const parseStyleString = (
  styleString: string
): Record<string, string> => {
  const result: Record<string, string> = {};

  if (!styleString) return result;

  styleString.split(';').forEach(declaration => {
    const [property, value] = declaration.split(':').map(s => s.trim());
    if (property && value) {
      // Convert kebab-case to camelCase
      const camelKey = property.replace(/-([a-z])/g, (_, letter) =>
        letter.toUpperCase()
      );
      result[camelKey] = value;
    }
  });

  return result;
};

/**
 * Media query breakpoints (Tailwind defaults)
 */
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/**
 * Generate media query string
 */
export const mediaQuery = (
  breakpoint: keyof typeof breakpoints | number,
  type: 'min' | 'max' = 'min'
): string => {
  const value =
    typeof breakpoint === 'number' ? breakpoint : breakpoints[breakpoint];

  const adjustedValue = type === 'max' ? value - 1 : value;
  return `@media (${type}-width: ${adjustedValue}px)`;
};

/**
 * Check if media query matches (client-side only)
 */
export const matchesMediaQuery = (query: string): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(query).matches;
};

/**
 * Check if screen is at least a certain breakpoint
 */
export const isBreakpoint = (
  breakpoint: keyof typeof breakpoints,
  type: 'min' | 'max' = 'min'
): boolean => {
  const value = breakpoints[breakpoint];
  const adjustedValue = type === 'max' ? value - 1 : value;
  return matchesMediaQuery(`(${type}-width: ${adjustedValue}px)`);
};

/**
 * Common spacing scale (in rem, based on 4px base)
 */
export const spacing = {
  0: '0',
  px: '1px',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  11: '2.75rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  28: '7rem',
  32: '8rem',
  36: '9rem',
  40: '10rem',
  44: '11rem',
  48: '12rem',
  52: '13rem',
  56: '14rem',
  60: '15rem',
  64: '16rem',
  72: '18rem',
  80: '20rem',
  96: '24rem',
} as const;

/**
 * Convert pixel value to rem
 */
export const pxToRem = (px: number, base = 16): string => {
  return `${px / base}rem`;
};

/**
 * Convert rem value to pixels
 */
export const remToPx = (rem: number, base = 16): number => {
  return rem * base;
};

/**
 * Common transition presets
 */
export const transitions = {
  none: 'none',
  all: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  colors:
    'color, background-color, border-color, text-decoration-color, fill, stroke 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  opacity: 'opacity 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  shadow: 'box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  transform: 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

/**
 * Common animation duration presets
 */
export const durations = {
  75: '75ms',
  100: '100ms',
  150: '150ms',
  200: '200ms',
  300: '300ms',
  500: '500ms',
  700: '700ms',
  1000: '1000ms',
} as const;

/**
 * Common easing functions
 */
export const easings = {
  linear: 'linear',
  in: 'cubic-bezier(0.4, 0, 1, 1)',
  out: 'cubic-bezier(0, 0, 0.2, 1)',
  inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

/**
 * Generate gradient string
 */
export const gradient = (
  direction:
    | 'to-t'
    | 'to-tr'
    | 'to-r'
    | 'to-br'
    | 'to-b'
    | 'to-bl'
    | 'to-l'
    | 'to-tl'
    | number,
  ...colors: string[]
): string => {
  const directionMap = {
    'to-t': 'to top',
    'to-tr': 'to top right',
    'to-r': 'to right',
    'to-br': 'to bottom right',
    'to-b': 'to bottom',
    'to-bl': 'to bottom left',
    'to-l': 'to left',
    'to-tl': 'to top left',
  };

  const dir =
    typeof direction === 'number' ? `${direction}deg` : directionMap[direction];

  return `linear-gradient(${dir}, ${colors.join(', ')})`;
};

/**
 * Generate box shadow string
 */
export const shadow = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: 'none',
} as const;

/**
 * Generate custom box shadow
 */
export const customShadow = (
  offsetX: number,
  offsetY: number,
  blur: number,
  spread: number,
  color: string,
  inset = false
): string => {
  return `${inset ? 'inset ' : ''}${offsetX}px ${offsetY}px ${blur}px ${spread}px ${color}`;
};

/**
 * Font size scale (with line heights)
 */
export const fontSize = {
  xs: ['0.75rem', { lineHeight: '1rem' }],
  sm: ['0.875rem', { lineHeight: '1.25rem' }],
  base: ['1rem', { lineHeight: '1.5rem' }],
  lg: ['1.125rem', { lineHeight: '1.75rem' }],
  xl: ['1.25rem', { lineHeight: '1.75rem' }],
  '2xl': ['1.5rem', { lineHeight: '2rem' }],
  '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
  '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
  '5xl': ['3rem', { lineHeight: '1' }],
  '6xl': ['3.75rem', { lineHeight: '1' }],
  '7xl': ['4.5rem', { lineHeight: '1' }],
  '8xl': ['6rem', { lineHeight: '1' }],
  '9xl': ['8rem', { lineHeight: '1' }],
} as const;

/**
 * Font weight scale
 */
export const fontWeight = {
  thin: '100',
  extralight: '200',
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
} as const;

/**
 * Border radius scale
 */
export const borderRadius = {
  none: '0',
  sm: '0.125rem',
  DEFAULT: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  full: '9999px',
} as const;

/**
 * Z-index scale
 */
export const zIndex = {
  0: '0',
  10: '10',
  20: '20',
  30: '30',
  40: '40',
  50: '50',
  auto: 'auto',
  dropdown: '1000',
  sticky: '1020',
  fixed: '1030',
  modalBackdrop: '1040',
  modal: '1050',
  popover: '1060',
  tooltip: '1070',
} as const;

/**
 * Aspect ratio presets
 */
export const aspectRatio = {
  auto: 'auto',
  square: '1 / 1',
  video: '16 / 9',
  photo: '4 / 3',
  wide: '21 / 9',
  portrait: '3 / 4',
} as const;

/**
 * Container max-width presets
 */
export const containerWidth = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  prose: '65ch',
} as const;
