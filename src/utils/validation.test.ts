import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  emailSchema,
  urlSchema,
  filePathSchema,
  safeStringSchema,
  portSchema,
  severitySchema,
  hexColorSchema,
  slugSchema,
  phoneSchema,
  paginationSchema,
  sortSchema,
  sanitizeHtml,
  sanitizeInput,
  sanitizeFileName,
  validateEnvVar,
  safeJsonParse,
  dateRangeSchema,
  isValidObject,
  isNonEmptyString,
} from './validation';

describe('Validation Utilities', () => {
  describe('Schemas', () => {
    it('emailSchema should validate emails', () => {
      expect(emailSchema.safeParse('test@example.com').success).toBe(true);
      expect(emailSchema.safeParse('invalid-email').success).toBe(false);
    });

    it('urlSchema should validate HTTP/HTTPS URLs', () => {
      expect(urlSchema.safeParse('https://example.com').success).toBe(true);
      expect(urlSchema.safeParse('http://example.com').success).toBe(true);
      expect(urlSchema.safeParse('ftp://example.com').success).toBe(false);
      expect(urlSchema.safeParse('invalid-url').success).toBe(false);
    });

    it('filePathSchema should validate file paths', () => {
      expect(filePathSchema.safeParse('path/to/file.txt').success).toBe(true);
      expect(filePathSchema.safeParse('../path/to/file.txt').success).toBe(
        false
      ); // No traversal
      expect(filePathSchema.safeParse('path/to/file?.txt').success).toBe(false); // No invalid chars
    });

    it('safeStringSchema should reject dangerous patterns', () => {
      expect(safeStringSchema.safeParse('Hello World').success).toBe(true);
      expect(
        safeStringSchema.safeParse('<script>alert(1)</script>').success
      ).toBe(false);
      expect(safeStringSchema.safeParse('javascript:alert(1)').success).toBe(
        false
      );
      expect(safeStringSchema.safeParse('onclick=alert(1)').success).toBe(
        false
      );
    });

    it('portSchema should validate ports', () => {
      expect(portSchema.safeParse(8080).success).toBe(true);
      expect(portSchema.safeParse(0).success).toBe(false);
      expect(portSchema.safeParse(70000).success).toBe(false);
    });

    it('severitySchema should validate severity levels', () => {
      expect(severitySchema.safeParse('critical').success).toBe(true);
      expect(severitySchema.safeParse('invalid').success).toBe(false);
    });

    it('hexColorSchema should validate hex colors', () => {
      expect(hexColorSchema.safeParse('#ffffff').success).toBe(true);
      expect(hexColorSchema.safeParse('#fff').success).toBe(true);
      expect(hexColorSchema.safeParse('ffffff').success).toBe(false); // Missing #
      expect(hexColorSchema.safeParse('#zzzzzz').success).toBe(false);
    });

    it('slugSchema should validate slugs', () => {
      expect(slugSchema.safeParse('my-slug-123').success).toBe(true);
      expect(slugSchema.safeParse('My-Slug').success).toBe(false); // Lowercase only
      expect(slugSchema.safeParse('slug_with_underscore').success).toBe(false); // Hyphens only
    });

    it('phoneSchema should validate phone numbers', () => {
      expect(phoneSchema.safeParse('+1234567890').success).toBe(true);
      expect(phoneSchema.safeParse('1234567890').success).toBe(true);
      expect(phoneSchema.safeParse('abc').success).toBe(false);
    });

    it('paginationSchema should validate pagination params', () => {
      expect(paginationSchema.safeParse({ page: 1, limit: 10 }).success).toBe(
        true
      );
      expect(paginationSchema.safeParse({ page: 0 }).success).toBe(false); // Positive
      expect(paginationSchema.safeParse({ limit: 101 }).success).toBe(false); // Max 100
    });

    it('sortSchema should validate sort params', () => {
      expect(
        sortSchema.safeParse({ field: 'name', direction: 'asc' }).success
      ).toBe(true);
      expect(sortSchema.safeParse({ field: 'name' }).success).toBe(true); // Default direction
      expect(sortSchema.safeParse({ field: '' }).success).toBe(false);
    });

    it('dateRangeSchema should validate date ranges', () => {
      const from = new Date('2023-01-01');
      const to = new Date('2023-01-02');
      expect(dateRangeSchema.safeParse({ from, to }).success).toBe(true);
      expect(dateRangeSchema.safeParse({ from: to, to: from }).success).toBe(
        false
      ); // from > to
    });
  });

  describe('Functions', () => {
    it('sanitizeHtml should remove dangerous tags', () => {
      const input = '<script>alert(1)</script><p>Hello</p>';
      expect(sanitizeHtml(input)).toBe('<p>Hello</p>');
    });

    it('sanitizeInput should remove angle brackets', () => {
      expect(sanitizeInput('<b>Bold</b>')).toBe('bBold/b');
    });

    it('sanitizeFileName should make file names safe', () => {
      expect(sanitizeFileName('My File?.txt')).toBe('My_File_.txt');
      expect(sanitizeFileName('../../etc/passwd')).toBe('.._.._etc_passwd');
    });

    it('validateEnvVar should return value or throw', () => {
      expect(validateEnvVar('TEST_VAR', 'value')).toBe('value');
      expect(validateEnvVar('TEST_VAR', undefined, false)).toBeUndefined();
      expect(() => validateEnvVar('TEST_VAR', undefined, true)).toThrow();
    });

    it('safeJsonParse should parse valid JSON', () => {
      expect(safeJsonParse('{"a":1}')).toEqual({ a: 1 });
    });

    it('safeJsonParse should return null for invalid JSON', () => {
      expect(safeJsonParse('{a:1}')).toBeNull();
    });

    it('safeJsonParse should validate with schema', () => {
      const schema = z.object({ a: z.number() });
      expect(safeJsonParse('{"a":1}', schema)).toEqual({ a: 1 });
      // Schema validation failure is caught and returns null
      expect(safeJsonParse('{"a":"string"}', schema)).toBeNull();
    });

    it('isValidObject should check for object type', () => {
      expect(isValidObject({})).toBe(true);
      expect(isValidObject(null)).toBe(false);
      expect(isValidObject([])).toBe(false);
      expect(isValidObject('string')).toBe(false);
    });

    it('isNonEmptyString should check for non-empty string', () => {
      expect(isNonEmptyString('hello')).toBe(true);
      expect(isNonEmptyString('  ')).toBe(false);
      expect(isNonEmptyString('')).toBe(false);
      expect(isNonEmptyString(123)).toBe(false);
    });
  });
});
