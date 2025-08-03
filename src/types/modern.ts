// TypeScript type definitions for Astro + Tailwind + TypeScript setup

/* ==================== CORE TYPES ==================== */

// Component size system
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

// Color variants for design system
export type ColorVariant =
  | 'primary'
  | 'accent'
  | 'neutral'
  | 'success'
  | 'warning'
  | 'error'
  | 'info';

// Animation types
export type AnimationType =
  | 'fade-in'
  | 'slide-in'
  | 'scale-in'
  | 'bounce-in'
  | 'float';

// Responsive breakpoints
export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/* ==================== BLOG TYPES ==================== */

// Blog post frontmatter structure
export interface BlogPostFrontmatter {
  title: string;
  description: string;
  pubDate: Date;
  updatedDate?: Date;
  heroImage?: string;
  tags?: string[];
  author?: string;
  draft?: boolean;
  featured?: boolean;
  category?: string;
  readingTime?: number;
}

// Complete blog post with content
export interface BlogPost {
  slug: string;
  frontmatter: BlogPostFrontmatter;
  excerpt?: string;
  wordCount?: number;
}

// Blog categories
export interface BlogCategory {
  name: string;
  slug: string;
  description?: string;
  color?: string;
  postCount?: number;
}

// Blog tags
export interface BlogTag {
  name: string;
  slug: string;
  postCount?: number;
}

/* ==================== UI COMPONENT TYPES ==================== */

// Base props for all components
export interface BaseProps {
  className?: string;
  'data-testid'?: string;
}

// Button component properties
export interface ButtonProps extends BaseProps {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline';
  size?: ComponentSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
  href?: string;
  target?: '_blank' | '_self' | '_parent' | '_top';
}

// Card component properties
export interface CardProps extends BaseProps {
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  padding?: ComponentSize;
  hover?: boolean;
  clickable?: boolean;
}

// Navigation item structure
export interface NavigationItem {
  label: string;
  href: string;
  badge?: string | number;
  active?: boolean;
  disabled?: boolean;
  children?: NavigationItem[];
  external?: boolean;
  description?: string;
}

// Form field base properties
export interface FormFieldProps extends BaseProps {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  name?: string;
}

// Input component properties
export interface InputProps extends FormFieldProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  readOnly?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  size?: ComponentSize;
}

/* ==================== LAYOUT TYPES ==================== */

// Grid system properties
export interface GridProps extends BaseProps {
  cols?: number | Partial<Record<Breakpoint, number>>;
  gap?: ComponentSize | Partial<Record<Breakpoint, ComponentSize>>;
  rows?: number | Partial<Record<Breakpoint, number>>;
  autoFit?: boolean;
  autoFill?: boolean;
  minItemWidth?: string;
}

// Container properties
export interface ContainerProps extends BaseProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: ComponentSize | Partial<Record<Breakpoint, ComponentSize>>;
  center?: boolean;
}

/* ==================== DATA TYPES ==================== */

// API response wrapper
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
  success: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Search functionality
export interface SearchFilters {
  query?: string;
  category?: string;
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  author?: string;
  sortBy?: 'date' | 'title' | 'popularity' | 'relevance';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface SearchResult<T = unknown> {
  items: T[];
  total: number;
  facets?: Record<string, Array<{ value: string; count: number }>>;
  suggestions?: string[];
  took?: number;
}

/* ==================== THEME TYPES ==================== */

// Color scheme for dark/light mode
export type ColorScheme = 'light' | 'dark' | 'system';

// Theme configuration
export interface ThemeConfig {
  colors: {
    primary: Record<string, string>;
    accent: Record<string, string>;
    neutral: Record<string, string>;
  };
  typography: {
    fontFamily: {
      sans: string[];
      serif: string[];
      mono: string[];
    };
    fontSize: Record<string, [string, { lineHeight: string }]>;
  };
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
  boxShadow: Record<string, string>;
}

// Theme context for React-like usage
export interface ThemeContextType {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  isDark: boolean;
  toggle: () => void;
}

/* ==================== PERFORMANCE TYPES ==================== */

// Performance metrics
export interface PerformanceMetrics {
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
}

// Loading states
export interface LoadingState {
  isLoading: boolean;
  error?: Error | null;
  retry?: () => void;
}

/* ==================== UTILITY TYPES ==================== */

// Deep partial for configuration objects
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Require at least one property
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

// Make object properties prettier in IDE
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & Record<string, never>;

/* ==================== TYPE GUARDS ==================== */

// Runtime type checking utilities
export const isString = (value: unknown): value is string =>
  typeof value === 'string';

export const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && !isNaN(value);

export const isBoolean = (value: unknown): value is boolean =>
  typeof value === 'boolean';

export const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const isArray = <T = unknown>(value: unknown): value is T[] =>
  Array.isArray(value);

export const isDefined = <T>(value: T | undefined | null): value is T =>
  value !== undefined && value !== null;

/* ==================== ASSERTION UTILITIES ==================== */

// Type assertion with error handling
export const assertString = (
  value: unknown,
  message = 'Expected string'
): string => {
  if (!isString(value)) throw new Error(message);
  return value;
};

export const assertNumber = (
  value: unknown,
  message = 'Expected number'
): number => {
  if (!isNumber(value)) throw new Error(message);
  return value;
};

export const assertObject = <T extends Record<string, unknown>>(
  value: unknown,
  message = 'Expected object'
): T => {
  if (!isObject(value)) throw new Error(message);
  return value as T;
};

/* ==================== ASTRO SPECIFIC TYPES ==================== */

// Astro component props
export interface AstroComponentProps {
  [key: string]: unknown;
}

// Astro page props
export interface AstroPageProps {
  params: Record<string, string | undefined>;
  request: Request;
  url: URL;
}

// Astro collection entry
export interface AstroCollectionEntry<T = Record<string, unknown>> {
  id: string;
  slug: string;
  body: string;
  collection: string;
  data: T;
}

/* ==================== GLOBAL AUGMENTATIONS ==================== */

// Extend global types for better Astro support
declare global {
  interface ImportMetaEnv {
    readonly SITE_URL: string;
    readonly PUBLIC_GOOGLE_ANALYTICS_ID?: string;
    readonly PUBLIC_GITHUB_TOKEN?: string;
    readonly DATABASE_URL?: string;
    readonly EMAIL_FROM?: string;
    readonly EMAIL_API_KEY?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

/* ==================== EXPORTS ==================== */

// Default export with utilities
const TypeUtils = {
  isString,
  isNumber,
  isBoolean,
  isObject,
  isArray,
  isDefined,
  assertString,
  assertNumber,
  assertObject,
};

export default TypeUtils;
