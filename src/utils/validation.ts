import { z } from 'zod';

/**
 * Validation utilities for input sanitization and validation
 */

// Email validation schema
export const emailSchema = z.string().email('Invalid email address');

// URL validation schema
export const urlSchema = z.string().url('Invalid URL format');

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
 * Create a custom validation error with helpful message
 */
export class ValidationError extends Error {
  constructor(
    public field: string,
    message: string,
    public value?: unknown
  ) {
    super(`Validation error in field '${field}': ${message}`);
    this.name = 'ValidationError';
  }
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
      throw new ValidationError(
        String(field),
        'This field is required',
        obj[field]
      );
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
