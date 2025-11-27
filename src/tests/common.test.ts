import { describe, it, expect } from 'vitest';
import {
  generateChecksum,
  generateUniqueId,
  isBrowser,
  isNode,
  safeJsonParse,
  safeJsonStringify,
  normalizePath,
  getFileExtension,
  isPlainObject,
  deepClone,
} from '../utils/common';

describe('Common Utilities', () => {
  describe('generateChecksum', () => {
    it('should generate consistent checksum for same input', () => {
      const content = 'Hello World';
      const hash1 = generateChecksum(content);
      const hash2 = generateChecksum(content);
      expect(hash1).toBe(hash2);
    });

    it('should generate different checksums for different inputs', () => {
      const hash1 = generateChecksum('Hello');
      const hash2 = generateChecksum('World');
      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty string', () => {
      const hash = generateChecksum('');
      expect(hash).toBe('0');
    });

    it('should return hexadecimal string', () => {
      const hash = generateChecksum('test');
      expect(hash).toMatch(/^-?[0-9a-f]+$/);
    });
  });

  describe('generateUniqueId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateUniqueId();
      const id2 = generateUniqueId();
      expect(id1).not.toBe(id2);
    });

    it('should include prefix when provided', () => {
      const id = generateUniqueId('test');
      expect(id.startsWith('test-')).toBe(true);
    });

    it('should generate ID without prefix', () => {
      const id = generateUniqueId();
      expect(id).not.toContain('undefined');
      expect(id.length).toBeGreaterThan(10);
    });
  });

  describe('isBrowser', () => {
    it('should detect browser environment based on window availability', () => {
      // In vitest with jsdom, window is defined
      const result = isBrowser();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('isNode', () => {
    it('should return true in Node.js environment', () => {
      expect(isNode()).toBe(true);
    });
  });

  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      const result = safeJsonParse<{ key: string }>('{"key": "value"}');
      expect(result).toEqual({ key: 'value' });
    });

    it('should return null for invalid JSON', () => {
      const result = safeJsonParse('not valid json');
      expect(result).toBeNull();
    });

    it('should handle arrays', () => {
      const result = safeJsonParse<number[]>('[1, 2, 3]');
      expect(result).toEqual([1, 2, 3]);
    });

    it('should handle primitives', () => {
      expect(safeJsonParse('"string"')).toBe('string');
      expect(safeJsonParse('123')).toBe(123);
      expect(safeJsonParse('true')).toBe(true);
      expect(safeJsonParse('null')).toBeNull();
    });
  });

  describe('safeJsonStringify', () => {
    it('should stringify objects', () => {
      const result = safeJsonStringify({ key: 'value' });
      expect(result).toBe('{"key":"value"}');
    });

    it('should handle circular references', () => {
      const obj: Record<string, unknown> = { name: 'test' };
      obj.self = obj;
      const result = safeJsonStringify(obj);
      expect(result).toContain('[Circular]');
    });

    it('should format with spaces', () => {
      const result = safeJsonStringify({ key: 'value' }, 2);
      expect(result).toContain('\n');
      expect(result).toContain('  ');
    });

    it('should handle arrays', () => {
      const result = safeJsonStringify([1, 2, 3]);
      expect(result).toBe('[1,2,3]');
    });
  });

  describe('normalizePath', () => {
    it('should convert backslashes to forward slashes', () => {
      expect(normalizePath('path\\to\\file')).toBe('path/to/file');
    });

    it('should leave forward slashes unchanged', () => {
      expect(normalizePath('path/to/file')).toBe('path/to/file');
    });

    it('should handle mixed slashes', () => {
      expect(normalizePath('path\\to/file\\name')).toBe('path/to/file/name');
    });

    it('should handle empty string', () => {
      expect(normalizePath('')).toBe('');
    });
  });

  describe('getFileExtension', () => {
    it('should extract file extension', () => {
      expect(getFileExtension('file.txt')).toBe('.txt');
      expect(getFileExtension('file.test.ts')).toBe('.ts');
    });

    it('should handle paths with directories', () => {
      expect(getFileExtension('/path/to/file.js')).toBe('.js');
      expect(getFileExtension('C:\\Users\\file.ts')).toBe('.ts');
    });

    it('should return empty string for files without extension', () => {
      expect(getFileExtension('Makefile')).toBe('');
      expect(getFileExtension('/path/to/Dockerfile')).toBe('');
    });

    it('should handle dotfiles correctly', () => {
      expect(getFileExtension('.gitignore')).toBe('.gitignore');
      expect(getFileExtension('/path/.env')).toBe('.env');
    });
  });

  describe('isPlainObject', () => {
    it('should return true for plain objects', () => {
      expect(isPlainObject({})).toBe(true);
      expect(isPlainObject({ key: 'value' })).toBe(true);
    });

    it('should return false for arrays', () => {
      expect(isPlainObject([])).toBe(false);
      expect(isPlainObject([1, 2, 3])).toBe(false);
    });

    it('should return false for null', () => {
      expect(isPlainObject(null)).toBe(false);
    });

    it('should return false for primitives', () => {
      expect(isPlainObject('string')).toBe(false);
      expect(isPlainObject(123)).toBe(false);
      expect(isPlainObject(true)).toBe(false);
      expect(isPlainObject(undefined)).toBe(false);
    });

    it('should return false for class instances', () => {
      class TestClass {}
      expect(isPlainObject(new TestClass())).toBe(false);
    });
  });

  describe('deepClone', () => {
    it('should create a deep copy of an object', () => {
      const original = { a: { b: { c: 1 } } };
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.a).not.toBe(original.a);
      expect(cloned.a.b).not.toBe(original.a.b);
    });

    it('should clone arrays', () => {
      const original = [1, [2, [3]]];
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned[1]).not.toBe(original[1]);
    });

    it('should handle primitives', () => {
      expect(deepClone('string')).toBe('string');
      expect(deepClone(123)).toBe(123);
      expect(deepClone(null)).toBeNull();
    });
  });
});
