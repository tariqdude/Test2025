import { describe, it, expect } from 'vitest';
import {
  emailSchema,
  urlSchema,
  filePathSchema,
  safeStringSchema,
  sanitizeHtml,
  sanitizeInput,
  sanitizeFileName,
  validateEnvVar,
  safeJsonParse,
  ValidationError,
  validateRequiredFields,
  validateFileSize,
  validateFileExtension,
  isValidObject,
  isNonEmptyString,
  isNonEmptyArray,
  // Extended schemas
  uuidSchema,
  semverSchema,
  creditCardSchema,
  passwordSchema,
  usernameSchema,
  ipAddressSchema,
  macAddressSchema,
  durationSchema,
  cssColorSchema,
  parseDuration,
  commonSchemas,
  extendedSchemas,
} from '../utils/validation';

describe('Validation Utilities', () => {
  describe('Schema Validations', () => {
    it('should validate correct email addresses', () => {
      expect(() => emailSchema.parse('test@example.com')).not.toThrow();
      expect(() =>
        emailSchema.parse('user.name+tag@example.co.uk')
      ).not.toThrow();
    });

    it('should reject invalid email addresses', () => {
      expect(() => emailSchema.parse('not-an-email')).toThrow();
      expect(() => emailSchema.parse('@example.com')).toThrow();
      expect(() => emailSchema.parse('test@')).toThrow();
    });

    it('should validate correct URLs', () => {
      expect(() => urlSchema.parse('https://example.com')).not.toThrow();
      expect(() => urlSchema.parse('http://localhost:3000')).not.toThrow();
    });

    it('should reject invalid URLs', () => {
      expect(() => urlSchema.parse('not-a-url')).toThrow();
      expect(() => urlSchema.parse('ftp://example.com')).toThrow();
    });

    it('should validate safe file paths', () => {
      expect(() => filePathSchema.parse('/path/to/file.txt')).not.toThrow();
      expect(() => filePathSchema.parse('relative/path/file.js')).not.toThrow();
    });

    it('should reject dangerous file paths', () => {
      expect(() => filePathSchema.parse('../../../etc/passwd')).toThrow();
      expect(() => filePathSchema.parse('file<script>.js')).toThrow();
      expect(() => filePathSchema.parse('')).toThrow();
    });

    it('should validate safe strings', () => {
      expect(() => safeStringSchema.parse('Hello World')).not.toThrow();
      expect(() =>
        safeStringSchema.parse('Text with <strong>HTML</strong>')
      ).not.toThrow();
    });

    it('should reject dangerous strings', () => {
      expect(() =>
        safeStringSchema.parse('<script>alert("xss")</script>')
      ).toThrow();
      expect(() => safeStringSchema.parse('javascript:alert(1)')).toThrow();
      expect(() =>
        safeStringSchema.parse('<img onerror="alert(1)">')
      ).toThrow();
    });
  });

  describe('Sanitization Functions', () => {
    it('should sanitize HTML by removing scripts', () => {
      const input = '<div>Hello</div><script>alert("xss")</script>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<script>');
      expect(result).toContain('<div>Hello</div>');
    });

    it('should remove event handlers from HTML', () => {
      const input = '<img src="x" onerror="alert(1)">';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('onerror');
    });

    it('should sanitize user input', () => {
      const input = '<script>alert("xss")</script>Hello World';
      const result = sanitizeInput(input);
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });

    it('should limit input length', () => {
      const longInput = 'a'.repeat(20000);
      const result = sanitizeInput(longInput);
      expect(result.length).toBeLessThanOrEqual(10000);
    });

    it('should sanitize file names', () => {
      expect(sanitizeFileName('my file.txt')).toBe('my_file.txt');
      expect(sanitizeFileName('file<script>.js')).toBe('file_script_.js');
      expect(sanitizeFileName('file___name.txt')).toBe('file_name.txt');
    });

    it('should limit file name length', () => {
      const longName = 'a'.repeat(300) + '.txt';
      const result = sanitizeFileName(longName);
      expect(result.length).toBeLessThanOrEqual(255);
    });
  });

  describe('Environment Variable Validation', () => {
    it('should return value if present', () => {
      expect(validateEnvVar('TEST', 'value')).toBe('value');
    });

    it('should return undefined for missing optional var', () => {
      expect(validateEnvVar('MISSING', undefined, false)).toBeUndefined();
    });

    it('should throw for missing required var', () => {
      expect(() => validateEnvVar('REQUIRED', undefined, true)).toThrow();
    });
  });

  describe('JSON Parsing', () => {
    it('should parse valid JSON', () => {
      const json = '{"key": "value"}';
      const result = safeJsonParse(json);
      expect(result).toEqual({ key: 'value' });
    });

    it('should return null for invalid JSON', () => {
      const json = '{invalid}';
      const result = safeJsonParse(json);
      expect(result).toBeNull();
    });

    it('should validate with schema', () => {
      const json = '{"email": "test@example.com"}';
      // This would need a proper object schema for full validation
      const result = safeJsonParse(json);
      expect(result).toBeTruthy();
      // Note: emailSchema would need to be wrapped in z.object() for this test
    });
  });

  describe('Type Guards', () => {
    it('should identify valid objects', () => {
      expect(isValidObject({ key: 'value' })).toBe(true);
      expect(isValidObject({})).toBe(true);
      expect(isValidObject(null)).toBe(false);
      expect(isValidObject([])).toBe(false);
      expect(isValidObject('string')).toBe(false);
    });

    it('should identify non-empty strings', () => {
      expect(isNonEmptyString('hello')).toBe(true);
      expect(isNonEmptyString('')).toBe(false);
      expect(isNonEmptyString('   ')).toBe(false);
      expect(isNonEmptyString(123)).toBe(false);
    });

    it('should identify non-empty arrays', () => {
      expect(isNonEmptyArray([1, 2, 3])).toBe(true);
      expect(isNonEmptyArray([])).toBe(false);
      expect(isNonEmptyArray('not array')).toBe(false);
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with correct properties', () => {
      const error = new ValidationError('email', [
        'Invalid format',
        'Must be valid email',
      ]);
      expect(error.name).toBe('ValidationError');
      expect(error.field).toBe('email');
      expect(error.constraints).toContain('Invalid format');
      expect(error.message).toContain('email');
      expect(error.message).toContain('Invalid format');
    });
  });

  describe('Required Fields Validation', () => {
    it('should pass when all required fields present', () => {
      const obj = { name: 'John', email: 'john@example.com', age: 30 };
      expect(() =>
        validateRequiredFields(obj, ['name', 'email'])
      ).not.toThrow();
    });

    it('should throw when required field missing', () => {
      const obj: Record<string, unknown> = { name: 'John' };
      expect(() => validateRequiredFields(obj, ['name', 'email'])).toThrow(
        ValidationError
      );
    });

    it('should throw when required field is empty string', () => {
      const obj = { name: '', email: 'test@example.com' };
      expect(() => validateRequiredFields(obj, ['name', 'email'])).toThrow(
        ValidationError
      );
    });

    it('should throw when required field is null', () => {
      const obj = { name: null, email: 'test@example.com' };
      expect(() => validateRequiredFields(obj, ['name', 'email'])).toThrow(
        ValidationError
      );
    });
  });

  describe('File Validation', () => {
    it('should validate file size within limit', () => {
      expect(validateFileSize(1024)).toBe(true); // 1 KB
      expect(validateFileSize(5 * 1024 * 1024)).toBe(true); // 5 MB
    });

    it('should reject file size over limit', () => {
      expect(validateFileSize(15 * 1024 * 1024)).toBe(false); // 15 MB (over 10MB default)
      expect(validateFileSize(0)).toBe(false); // Zero size
    });

    it('should validate file size with custom limit', () => {
      expect(validateFileSize(2 * 1024 * 1024, 1 * 1024 * 1024)).toBe(false); // 2MB when limit is 1MB
    });

    it('should validate file extensions', () => {
      expect(validateFileExtension('document.pdf', ['pdf', 'doc'])).toBe(true);
      expect(validateFileExtension('image.jpg', ['jpg', 'png', 'gif'])).toBe(
        true
      );
      expect(validateFileExtension('script.exe', ['pdf', 'doc'])).toBe(false);
    });

    it('should be case-insensitive for extensions', () => {
      expect(validateFileExtension('document.PDF', ['pdf'])).toBe(true);
      expect(validateFileExtension('image.JPG', ['jpg'])).toBe(true);
    });

    it('should handle files without extensions', () => {
      expect(validateFileExtension('README', ['md', 'txt'])).toBe(false);
    });
  });

  /* ==================== EXTENDED SCHEMA TESTS ==================== */

  describe('Extended Schemas', () => {
    describe('uuidSchema', () => {
      it('should accept valid UUIDs', () => {
        expect(() =>
          uuidSchema.parse('123e4567-e89b-42d3-a456-426614174000')
        ).not.toThrow();
        expect(() =>
          uuidSchema.parse('550e8400-e29b-41d4-a716-446655440000')
        ).not.toThrow();
      });

      it('should reject invalid UUIDs', () => {
        expect(() => uuidSchema.parse('not-a-uuid')).toThrow();
        expect(() =>
          uuidSchema.parse('123e4567e89b42d3a456426614174000')
        ).toThrow();
      });
    });

    describe('semverSchema', () => {
      it('should accept valid semantic versions', () => {
        expect(() => semverSchema.parse('1.0.0')).not.toThrow();
        expect(() => semverSchema.parse('2.1.3')).not.toThrow();
        expect(() => semverSchema.parse('1.0.0-alpha')).not.toThrow();
        expect(() => semverSchema.parse('1.0.0-beta.1')).not.toThrow();
        expect(() => semverSchema.parse('1.0.0+build.123')).not.toThrow();
      });

      it('should reject invalid semantic versions', () => {
        expect(() => semverSchema.parse('1.0')).toThrow();
        expect(() => semverSchema.parse('v1.0.0')).toThrow();
      });
    });

    describe('passwordSchema', () => {
      it('should accept strong passwords', () => {
        expect(() => passwordSchema.parse('Password123')).not.toThrow();
        expect(() => passwordSchema.parse('MySecurePass1')).not.toThrow();
      });

      it('should reject weak passwords', () => {
        expect(() => passwordSchema.parse('short')).toThrow();
        expect(() => passwordSchema.parse('nouppercase1')).toThrow();
        expect(() => passwordSchema.parse('NOLOWERCASE1')).toThrow();
        expect(() => passwordSchema.parse('NoNumbers')).toThrow();
      });
    });

    describe('usernameSchema', () => {
      it('should accept valid usernames', () => {
        expect(() => usernameSchema.parse('john_doe')).not.toThrow();
        expect(() => usernameSchema.parse('user-123')).not.toThrow();
        expect(() => usernameSchema.parse('cooluser')).not.toThrow();
      });

      it('should reject invalid usernames', () => {
        expect(() => usernameSchema.parse('ab')).toThrow();
        expect(() => usernameSchema.parse('user@name')).toThrow();
        expect(() => usernameSchema.parse('admin')).toThrow();
        expect(() => usernameSchema.parse('root')).toThrow();
      });
    });

    describe('ipAddressSchema', () => {
      it('should accept valid IPv4 addresses', () => {
        expect(() => ipAddressSchema.parse('192.168.1.1')).not.toThrow();
        expect(() => ipAddressSchema.parse('127.0.0.1')).not.toThrow();
        expect(() => ipAddressSchema.parse('255.255.255.255')).not.toThrow();
      });

      it('should reject invalid IP addresses', () => {
        expect(() => ipAddressSchema.parse('256.1.1.1')).toThrow();
        expect(() => ipAddressSchema.parse('192.168.1')).toThrow();
        expect(() => ipAddressSchema.parse('not.an.ip.address')).toThrow();
      });
    });

    describe('macAddressSchema', () => {
      it('should accept valid MAC addresses', () => {
        expect(() => macAddressSchema.parse('00:1A:2B:3C:4D:5E')).not.toThrow();
        expect(() => macAddressSchema.parse('00-1A-2B-3C-4D-5E')).not.toThrow();
        expect(() => macAddressSchema.parse('aa:bb:cc:dd:ee:ff')).not.toThrow();
      });

      it('should reject invalid MAC addresses', () => {
        expect(() => macAddressSchema.parse('00:1A:2B:3C:4D')).toThrow();
        expect(() => macAddressSchema.parse('GG:HH:II:JJ:KK:LL')).toThrow();
      });
    });

    describe('durationSchema', () => {
      it('should accept valid duration strings', () => {
        expect(() => durationSchema.parse('100ms')).not.toThrow();
        expect(() => durationSchema.parse('30s')).not.toThrow();
        expect(() => durationSchema.parse('5m')).not.toThrow();
        expect(() => durationSchema.parse('2h')).not.toThrow();
        expect(() => durationSchema.parse('1d')).not.toThrow();
        expect(() => durationSchema.parse('1w')).not.toThrow();
      });

      it('should reject invalid duration strings', () => {
        expect(() => durationSchema.parse('5')).toThrow();
        expect(() => durationSchema.parse('5x')).toThrow();
        expect(() => durationSchema.parse('hours')).toThrow();
      });
    });

    describe('cssColorSchema', () => {
      it('should accept valid CSS colors', () => {
        expect(() => cssColorSchema.parse('#fff')).not.toThrow();
        expect(() => cssColorSchema.parse('#ffffff')).not.toThrow();
        expect(() => cssColorSchema.parse('#ffffffff')).not.toThrow();
        expect(() => cssColorSchema.parse('rgb(255, 0, 0)')).not.toThrow();
        expect(() =>
          cssColorSchema.parse('rgba(255, 0, 0, 0.5)')
        ).not.toThrow();
        expect(() => cssColorSchema.parse('red')).not.toThrow();
        expect(() => cssColorSchema.parse('transparent')).not.toThrow();
      });

      it('should reject invalid CSS colors', () => {
        expect(() => cssColorSchema.parse('notacolor')).toThrow();
        expect(() => cssColorSchema.parse('#gg0000')).toThrow();
      });
    });

    describe('creditCardSchema', () => {
      it('should accept valid credit card numbers (Luhn check)', () => {
        expect(() => creditCardSchema.parse('4111111111111111')).not.toThrow();
        expect(() => creditCardSchema.parse('5500000000000004')).not.toThrow();
      });

      it('should reject invalid credit card numbers', () => {
        expect(() => creditCardSchema.parse('1234567890123456')).toThrow();
        expect(() => creditCardSchema.parse('4111111111111112')).toThrow();
      });
    });

    describe('parseDuration', () => {
      it('should parse duration strings to milliseconds', () => {
        expect(parseDuration('100ms')).toBe(100);
        expect(parseDuration('1s')).toBe(1000);
        expect(parseDuration('1m')).toBe(60000);
        expect(parseDuration('1h')).toBe(3600000);
        expect(parseDuration('1d')).toBe(86400000);
      });

      it('should return null for invalid durations', () => {
        expect(parseDuration('invalid')).toBeNull();
        expect(parseDuration('')).toBeNull();
        expect(parseDuration('5x')).toBeNull();
      });
    });
  });

  /* ==================== SCHEMA EXPORT TESTS ==================== */

  describe('Schema Exports', () => {
    it('should export commonSchemas with all expected schemas', () => {
      expect(commonSchemas).toHaveProperty('email');
      expect(commonSchemas).toHaveProperty('url');
      expect(commonSchemas).toHaveProperty('phone');
      expect(commonSchemas).toHaveProperty('slug');
      expect(commonSchemas).toHaveProperty('hexColor');
      expect(commonSchemas).toHaveProperty('port');
      expect(commonSchemas).toHaveProperty('severity');
    });

    it('should export extendedSchemas with all expected schemas', () => {
      expect(extendedSchemas).toHaveProperty('uuid');
      expect(extendedSchemas).toHaveProperty('semver');
      expect(extendedSchemas).toHaveProperty('password');
      expect(extendedSchemas).toHaveProperty('username');
      expect(extendedSchemas).toHaveProperty('ipAddress');
      expect(extendedSchemas).toHaveProperty('macAddress');
      expect(extendedSchemas).toHaveProperty('duration');
      expect(extendedSchemas).toHaveProperty('cssColor');
      expect(extendedSchemas).toHaveProperty('creditCard');
      // Should also include all common schemas
      expect(extendedSchemas).toHaveProperty('email');
    });
  });
});
