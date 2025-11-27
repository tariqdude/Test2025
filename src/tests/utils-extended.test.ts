/**
 * Extended utility function tests
 * Additional tests for array, string, object, and performance utilities
 */

import { describe, it, expect, vi } from 'vitest';
import {
  truncate,
  titleCase,
  getInitials,
  unique,
  groupBy,
  chunk,
  shuffle,
  deepMerge,
  pick,
  omit,
  buildUrl,
  parseQuery,
  cn,
  cssVariables,
  formatNumber,
  formatFileSize,
  slugify,
  isEmpty,
  isValidUrl,
  sleep,
  retry,
  measureTime,
} from '../utils/index';

/* ==================== STRING UTILITIES ==================== */

describe('String Utilities', () => {
  describe('truncate', () => {
    it('should not truncate short text', () => {
      expect(truncate('Hello', 10)).toBe('Hello');
    });

    it('should truncate long text with word boundary', () => {
      expect(truncate('Hello world how are you', 15)).toBe('Hello world...');
    });

    it('should use custom suffix', () => {
      expect(truncate('Hello world how are you', 15, ' [more]')).toBe(
        'Hello [more]'
      );
    });

    it('should handle text equal to maxLength', () => {
      expect(truncate('Hello', 5)).toBe('Hello');
    });

    it('should handle single long word', () => {
      expect(truncate('Supercalifragilisticexpialidocious', 10)).toBe(
        'Superca...'
      );
    });
  });

  describe('titleCase', () => {
    it('should capitalize first letter of each word', () => {
      expect(titleCase('hello world')).toBe('Hello World');
    });

    it('should handle already capitalized text', () => {
      expect(titleCase('HELLO WORLD')).toBe('Hello World');
    });

    it('should handle mixed case', () => {
      expect(titleCase('hElLo WoRlD')).toBe('Hello World');
    });

    it('should handle single word', () => {
      expect(titleCase('hello')).toBe('Hello');
    });
  });

  describe('getInitials', () => {
    it('should extract initials from two-word name', () => {
      expect(getInitials('John Doe')).toBe('JD');
    });

    it('should limit initials to maxInitials', () => {
      expect(getInitials('John Michael Doe', 2)).toBe('JM');
      expect(getInitials('John Michael Doe', 3)).toBe('JMD');
    });

    it('should handle single name', () => {
      expect(getInitials('John')).toBe('J');
    });
  });

  describe('slugify', () => {
    it('should convert text to slug format', () => {
      expect(slugify('Hello World')).toBe('hello-world');
    });

    it('should handle special characters', () => {
      expect(slugify('Hello & World!')).toBe('hello-world');
    });

    it('should handle multiple spaces', () => {
      expect(slugify('Hello    World')).toBe('hello-world');
    });

    it('should trim leading/trailing dashes', () => {
      expect(slugify('-Hello World-')).toBe('hello-world');
    });
  });
});

/* ==================== ARRAY UTILITIES ==================== */

describe('Array Utilities', () => {
  describe('unique', () => {
    it('should remove duplicates from array', () => {
      expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
    });

    it('should work with strings', () => {
      expect(unique(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
    });

    it('should handle empty array', () => {
      expect(unique([])).toEqual([]);
    });

    it('should handle array with no duplicates', () => {
      expect(unique([1, 2, 3])).toEqual([1, 2, 3]);
    });
  });

  describe('groupBy', () => {
    it('should group items by key function', () => {
      const items = [
        { category: 'a', value: 1 },
        { category: 'b', value: 2 },
        { category: 'a', value: 3 },
      ];
      const result = groupBy(items, item => item.category);

      expect(result.a).toHaveLength(2);
      expect(result.b).toHaveLength(1);
    });

    it('should handle empty array', () => {
      expect(groupBy([], () => 'key')).toEqual({});
    });
  });

  describe('chunk', () => {
    it('should split array into chunks', () => {
      expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    });

    it('should handle array smaller than chunk size', () => {
      expect(chunk([1, 2], 5)).toEqual([[1, 2]]);
    });

    it('should handle empty array', () => {
      expect(chunk([], 5)).toEqual([]);
    });

    it('should throw for non-positive size', () => {
      expect(() => chunk([1, 2], 0)).toThrow('Chunk size must be positive');
    });
  });

  describe('shuffle', () => {
    it('should return array of same length', () => {
      const arr = [1, 2, 3, 4, 5];
      expect(shuffle(arr)).toHaveLength(5);
    });

    it('should contain same elements', () => {
      const arr = [1, 2, 3, 4, 5];
      const shuffled = shuffle(arr);
      expect(shuffled.sort()).toEqual(arr.sort());
    });

    it('should not mutate original array', () => {
      const arr = [1, 2, 3, 4, 5];
      const original = [...arr];
      shuffle(arr);
      expect(arr).toEqual(original);
    });
  });
});

/* ==================== OBJECT UTILITIES ==================== */

describe('Object Utilities', () => {
  describe('deepMerge', () => {
    it('should merge flat objects', () => {
      const result = deepMerge({ a: 1 }, { b: 2 });
      expect(result).toEqual({ a: 1, b: 2 });
    });

    it('should merge nested objects', () => {
      const result = deepMerge({ a: { x: 1 } }, { a: { y: 2 } });
      expect(result).toEqual({ a: { x: 1, y: 2 } });
    });

    it('should handle multiple sources', () => {
      const result = deepMerge({ a: 1 }, { b: 2 }, { c: 3 });
      expect(result).toEqual({ a: 1, b: 2, c: 3 });
    });
  });

  describe('pick', () => {
    it('should pick specified keys', () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(pick(obj, ['a', 'c'])).toEqual({ a: 1, c: 3 });
    });

    it('should ignore non-existent keys', () => {
      const obj = { a: 1, b: 2 };
      expect(pick(obj, ['a', 'd' as keyof typeof obj])).toEqual({ a: 1 });
    });
  });

  describe('omit', () => {
    it('should omit specified keys', () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(omit(obj, ['b'])).toEqual({ a: 1, c: 3 });
    });

    it('should handle omitting non-existent keys', () => {
      const obj = { a: 1, b: 2 };
      expect(omit(obj, ['c' as keyof typeof obj])).toEqual({ a: 1, b: 2 });
    });
  });
});

/* ==================== URL UTILITIES ==================== */

describe('URL Utilities', () => {
  describe('buildUrl', () => {
    it('should build URL with query params', () => {
      const result = buildUrl('https://example.com/api', {
        page: 1,
        limit: 10,
      });
      expect(result).toContain('page=1');
      expect(result).toContain('limit=10');
    });

    it('should skip undefined params', () => {
      const result = buildUrl('https://example.com/api', {
        page: 1,
        filter: undefined,
      });
      expect(result).not.toContain('filter');
    });

    it('should handle boolean params', () => {
      const result = buildUrl('https://example.com/api', { active: true });
      expect(result).toContain('active=true');
    });
  });

  describe('parseQuery', () => {
    it('should parse query string', () => {
      const result = parseQuery('?page=1&limit=10');
      expect(result).toEqual({ page: '1', limit: '10' });
    });

    it('should handle empty query', () => {
      expect(parseQuery('')).toEqual({});
    });
  });
});

/* ==================== CSS UTILITIES ==================== */

describe('CSS Utilities', () => {
  describe('cn', () => {
    it('should combine class names', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('should filter falsy values', () => {
      expect(cn('class1', null, undefined, false, 'class2')).toBe(
        'class1 class2'
      );
    });

    it('should handle single class', () => {
      expect(cn('class1')).toBe('class1');
    });

    it('should handle empty input', () => {
      expect(cn()).toBe('');
    });
  });

  describe('cssVariables', () => {
    it('should create CSS variable object', () => {
      const result = cssVariables({ color: 'red', size: 16 });
      expect(result).toEqual({ '--color': 'red', '--size': '16' });
    });

    it('should handle empty object', () => {
      expect(cssVariables({})).toEqual({});
    });
  });
});

/* ==================== FORMATTING UTILITIES ==================== */

describe('Formatting Utilities', () => {
  describe('formatNumber', () => {
    it('should format numbers with locale', () => {
      expect(formatNumber(1000)).toBe('1,000');
    });

    it('should handle decimal formatting', () => {
      const result = formatNumber(1234.567, { minimumFractionDigits: 2 });
      expect(result).toContain('1,234.5');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(500)).toBe('500 Bytes');
    });

    it('should format KB', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    it('should format MB', () => {
      expect(formatFileSize(1048576)).toBe('1 MB');
    });

    it('should format GB', () => {
      expect(formatFileSize(1073741824)).toBe('1 GB');
    });

    it('should respect decimal places', () => {
      expect(formatFileSize(1536, 0)).toBe('2 KB');
    });
  });
});

/* ==================== VALIDATION UTILITIES ==================== */

describe('Validation Utilities', () => {
  describe('isEmpty', () => {
    it('should detect null as empty', () => {
      expect(isEmpty(null)).toBe(true);
    });

    it('should detect undefined as empty', () => {
      expect(isEmpty(undefined)).toBe(true);
    });

    it('should detect empty string as empty', () => {
      expect(isEmpty('')).toBe(true);
      expect(isEmpty('   ')).toBe(true);
    });

    it('should detect empty array as empty', () => {
      expect(isEmpty([])).toBe(true);
    });

    it('should detect empty object as empty', () => {
      expect(isEmpty({})).toBe(true);
    });

    it('should detect non-empty values', () => {
      expect(isEmpty('hello')).toBe(false);
      expect(isEmpty([1])).toBe(false);
      expect(isEmpty({ a: 1 })).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    it('should validate correct URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('')).toBe(false);
    });
  });
});

/* ==================== ASYNC UTILITIES ==================== */

describe('Async Utilities', () => {
  describe('sleep', () => {
    it('should pause execution', async () => {
      const start = Date.now();
      await sleep(50);
      const duration = Date.now() - start;
      expect(duration).toBeGreaterThanOrEqual(45);
    });
  });

  describe('retry', () => {
    it('should succeed on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const result = await retry(fn);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and succeed', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce('success');

      const result = await retry(fn, 3, 10);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should throw after max attempts', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('always fail'));

      await expect(retry(fn, 2, 10)).rejects.toThrow('always fail');
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('measureTime', () => {
    it('should measure async function time', async () => {
      const fn = async () => {
        await sleep(50);
        return 'result';
      };

      const { result, duration } = await measureTime(fn);
      expect(result).toBe('result');
      expect(duration).toBeGreaterThanOrEqual(40);
    });

    it('should measure sync function time', async () => {
      const fn = () => {
        let sum = 0;
        for (let i = 0; i < 10000; i++) sum += i;
        return sum;
      };

      const { result, duration } = await measureTime(fn);
      expect(result).toBe(49995000);
      expect(duration).toBeGreaterThanOrEqual(0);
    });
  });
});
