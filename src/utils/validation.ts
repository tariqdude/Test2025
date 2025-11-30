import { z } from 'zod';
import { ValidationError } from '../errors';

// Re-export ValidationError for backward compatibility
export { ValidationError };

/**
 * Validation utilities for input sanitization and validation
 */

// Email validation schema
export const emailSchema = z.string().email('Invalid email address');

// URL validation schema (HTTP/HTTPS only)
export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .refine(
    url => url.startsWith('http://') || url.startsWith('https://'),
    'URL must use HTTP or HTTPS protocol'
  );

// File path validation (basic security check)
export const filePathSchema = z
  .string()
  .min(1, 'File path cannot be empty')
  .refine(
    path => !path.includes('..'),
    'File path cannot contain directory traversal patterns'
  )
  .refine(
    path => !/[<>:"|?*]/.test(path),
    'File path contains invalid characters'
  );

// Safe string (no script tags or dangerous patterns)
export const safeStringSchema = z
  .string()
  .refine(
    str => !/<script[^>]*>.*?<\/script>/gi.test(str),
    'String contains script tags'
  )
  .refine(
    str => !/javascript:/gi.test(str),
    'String contains javascript protocol'
  )
  .refine(
    str => !/on\w+\s*=/gi.test(str),
    'String contains inline event handlers'
  );

// Port number validation
export const portSchema = z.number().int().min(1).max(65535);

// Severity level validation
export const severitySchema = z.enum([
  'critical',
  'high',
  'medium',
  'low',
  'info',
]);

// Hex color validation
export const hexColorSchema = z
  .string()
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color format');

// Slug validation (URL-friendly string)
export const slugSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Slug must be lowercase alphanumeric with hyphens'
  );

// Phone number validation (flexible international format)
export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format');

// Pagination parameters
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
});

// Sort parameters
export const sortSchema = z.object({
  field: z.string().min(1),
  direction: z.enum(['asc', 'desc']).default('asc'),
});

/**
 * Sanitize HTML string by removing dangerous elements and attributes
 */
export function sanitizeHtml(html: string): string {
  // Basic HTML sanitization - remove script tags and event handlers
  return html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
}

/**
 * Sanitize user input for safe display
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim()
    .slice(0, 10000); // Limit length
}

/**
 * Validate and sanitize file name
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace invalid chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .slice(0, 255); // Limit to 255 chars
}

/**
 * Validate environment variable
 */
export function validateEnvVar(
  name: string,
  value: string | undefined,
  required = false
): string | undefined {
  if (required && !value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
}

/**
 * Safe JSON parse with validation
 */
export function safeJsonParse<T>(
  json: string,
  schema?: z.ZodSchema<T>
): T | null {
  try {
    const parsed = JSON.parse(json);
    if (schema) {
      return schema.parse(parsed);
    }
    return parsed as T;
  } catch {
    return null;
  }
}

/**
 * Validate date range
 */
export const dateRangeSchema = z
  .object({
    from: z.date(),
    to: z.date(),
  })
  .refine(
    data => data.from <= data.to,
    'Start date must be before or equal to end date'
  );

/**
 * Validate search query
 */
export const searchQuerySchema = z.object({
  q: z.string().min(1).max(500),
  filters: z.record(z.string(), z.string()).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

/**
 * Type guard for checking if value is a valid object
 */
export function isValidObject(
  value: unknown
): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard for checking if value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validate array has at least one element
 */
export function isNonEmptyArray<T>(value: unknown): value is [T, ...T[]] {
  return Array.isArray(value) && value.length > 0;
}

/**
 * Validate required fields in an object
 */
export function validateRequiredFields<T extends Record<string, unknown>>(
  obj: T,
  requiredFields: (keyof T)[]
): void {
  for (const field of requiredFields) {
    if (obj[field] === undefined || obj[field] === null || obj[field] === '') {
      throw new ValidationError(String(field), ['This field is required']);
    }
  }
}

/**
 * Validate file size (in bytes)
 */
export function validateFileSize(
  size: number,
  maxSize: number = 10 * 1024 * 1024 // 10MB default
): boolean {
  return size > 0 && size <= maxSize;
}

/**
 * Validate file extension
 */
export function validateFileExtension(
  fileName: string,
  allowedExtensions: string[]
): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase();
  return ext ? allowedExtensions.includes(ext) : false;
}

// Export common schemas as a bundle
export const commonSchemas = {
  email: emailSchema,
  url: urlSchema,
  filePath: filePathSchema,
  safeString: safeStringSchema,
  port: portSchema,
  severity: severitySchema,
  hexColor: hexColorSchema,
  slug: slugSchema,
  phone: phoneSchema,
  pagination: paginationSchema,
  sort: sortSchema,
  dateRange: dateRangeSchema,
  searchQuery: searchQuerySchema,
};

/* ==================== ADDITIONAL VALIDATORS ==================== */

/**
 * UUID validation (v4 format)
 */
export const uuidSchema = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    'Invalid UUID format'
  );

/**
 * Semantic version validation
 */
export const semverSchema = z
  .string()
  .regex(
    /^\d+\.\d+\.\d+(?:-[\da-zA-Z-]+(?:\.[\da-zA-Z-]+)*)?(?:\+[\da-zA-Z-]+(?:\.[\da-zA-Z-]+)*)?$/,
    'Invalid semantic version format'
  );

/**
 * ISO 8601 date string validation
 */
export const isoDateSchema = z.string().refine(value => {
  const date = new Date(value);
  return !isNaN(date.getTime()) && value === date.toISOString();
}, 'Invalid ISO 8601 date format');

/**
 * Credit card number validation (Luhn algorithm)
 */
export const creditCardSchema = z.string().refine(cardNumber => {
  const cleaned = cardNumber.replace(/\D/g, '');
  if (cleaned.length < 13 || cleaned.length > 19) return false;

  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}, 'Invalid credit card number');

/**
 * Password strength validation
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .refine(
    password => /[A-Z]/.test(password),
    'Password must contain at least one uppercase letter'
  )
  .refine(
    password => /[a-z]/.test(password),
    'Password must contain at least one lowercase letter'
  )
  .refine(
    password => /\d/.test(password),
    'Password must contain at least one number'
  );

/**
 * Username validation
 */
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be at most 30 characters')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Username can only contain letters, numbers, underscores, and hyphens'
  )
  .refine(
    username =>
      !['admin', 'root', 'system', 'null', 'undefined'].includes(
        username.toLowerCase()
      ),
    'This username is reserved'
  );

/**
 * IP address validation (IPv4 and IPv6)
 */
export const ipAddressSchema = z.string().refine(value => {
  // IPv4
  const ipv4Regex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  // IPv6
  const ipv6Regex = /^(?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}$/;
  return ipv4Regex.test(value) || ipv6Regex.test(value);
}, 'Invalid IP address format');

/**
 * MAC address validation
 */
export const macAddressSchema = z
  .string()
  .regex(
    /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
    'Invalid MAC address format'
  );

/**
 * CORS origin validation
 */
export const corsOriginSchema = z.union([
  z.literal('*'),
  z
    .string()
    .url()
    .refine(
      url => url.startsWith('http://') || url.startsWith('https://'),
      'Origin must use HTTP or HTTPS protocol'
    ),
  z.array(z.string().url()),
]);

/**
 * JWT token validation (basic structure)
 */
export const jwtSchema = z.string().refine(token => {
  const parts = token.split('.');
  if (parts.length !== 3) return false;

  try {
    parts.slice(0, 2).forEach(part => {
      // Check if parts are valid base64url
      const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
      atob(base64);
    });
    return true;
  } catch {
    return false;
  }
}, 'Invalid JWT token format');

/**
 * Cron expression validation (basic)
 */
export const cronSchema = z.string().refine(expression => {
  const parts = expression.trim().split(/\s+/);
  return parts.length >= 5 && parts.length <= 6;
}, 'Invalid cron expression format');

/**
 * HTML color validation (hex, rgb, rgba, hsl, hsla, named colors)
 */
export const cssColorSchema = z.string().refine(value => {
  // Hex colors
  if (
    /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3}|[A-Fa-f0-9]{8}|[A-Fa-f0-9]{4})$/.test(
      value
    )
  ) {
    return true;
  }
  // RGB/RGBA
  if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+\s*)?\)$/.test(value)) {
    return true;
  }
  // HSL/HSLA
  if (
    /^hsla?\(\s*\d+\s*,\s*[\d.]+%\s*,\s*[\d.]+%\s*(,\s*[\d.]+\s*)?\)$/.test(
      value
    )
  ) {
    return true;
  }
  // Named colors (common ones)
  const namedColors = [
    'transparent',
    'black',
    'white',
    'red',
    'green',
    'blue',
    'yellow',
    'orange',
    'purple',
    'pink',
    'gray',
    'grey',
  ];
  return namedColors.includes(value.toLowerCase());
}, 'Invalid CSS color format');

/**
 * Time duration validation (e.g., "1h", "30m", "2d")
 */
export const durationSchema = z.string().refine(value => {
  const regex = /^(\d+)(ms|s|m|h|d|w|M|y)$/;
  return regex.test(value);
}, 'Invalid duration format. Use format like "1h", "30m", "2d"');

/**
 * Parse duration string to milliseconds
 */
export function parseDuration(duration: string): number | null {
  const match = duration.match(/^(\d+)(ms|s|m|h|d|w|M|y)$/);
  if (!match) return null;

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
    M: 30 * 24 * 60 * 60 * 1000,
    y: 365 * 24 * 60 * 60 * 1000,
  };

  return value * multipliers[unit];
}

/**
 * Validate object matches a specific shape
 */
export function validateShape<T extends z.ZodRawShape>(
  data: unknown,
  shape: T
): z.infer<z.ZodObject<T>> | null {
  const schema = z.object(shape);
  const result = schema.safeParse(data);
  return result.success ? result.data : null;
}

/**
 * Create a rate limit key validator
 */
export const rateLimitKeySchema = z
  .string()
  .min(1)
  .max(256)
  .regex(/^[\w:.-]+$/, 'Invalid rate limit key format');

// Extended common schemas export
export const extendedSchemas = {
  ...commonSchemas,
  uuid: uuidSchema,
  semver: semverSchema,
  isoDate: isoDateSchema,
  creditCard: creditCardSchema,
  password: passwordSchema,
  username: usernameSchema,
  ipAddress: ipAddressSchema,
  macAddress: macAddressSchema,
  corsOrigin: corsOriginSchema,
  jwt: jwtSchema,
  cron: cronSchema,
  cssColor: cssColorSchema,
  duration: durationSchema,
  rateLimitKey: rateLimitKeySchema,
};

/**
 * Simple boolean validation helpers
 */

export const isValidEmail = (email: string): boolean => {
  return emailSchema.safeParse(email).success;
};

export const isValidUrl = (url: string): boolean => {
  return urlSchema.safeParse(url).success;
};

export const validatePhone = (phone: string): boolean => {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return phoneSchema.safeParse(cleaned).success;
};

export const isEmpty = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};
