import { describe, it, expect, vi } from 'vitest';
import {
  formatDate,
  getRelativeTime,
  buildUrl,
  withBasePath,
  getSlugFromTitle,
  truncateText,
  capitalizeFirst,
  capitalizeWords,
  groupBy,
  sortBy,
  unique,
  chunk,
} from '../utils/helpers';

describe('Helpers Utility', () => {
  /* ==================== DATE UTILITIES ==================== */

  describe('formatDate', () => {
    it('should format a Date object', () => {
      const date = new Date('2024-01-15');
      const result = formatDate(date);
      expect(result).toContain('2024');
      // Month and day may vary by locale, just check it's a valid string
      expect(result.length).toBeGreaterThan(4);
    });

    it('should format an ISO date string', () => {
      const result = formatDate('2024-06-20');
      expect(result).toContain('2024');
    });

    it('should return "Invalid Date" for invalid input', () => {
      const result = formatDate('not-a-date');
      expect(result).toBe('Invalid Date');
    });

    it('should apply custom options', () => {
      const date = new Date('2024-01-15');
      const result = formatDate(date, { year: 'numeric', month: 'short' });
      expect(result).toContain('Jan');
      expect(result).toContain('2024');
    });
  });

  describe('getRelativeTime', () => {
    it('should return "Just now" for very recent dates', () => {
      const now = new Date();
      const result = getRelativeTime(now);
      expect(result).toBe('Just now');
    });

    it('should return minutes ago', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const result = getRelativeTime(fiveMinutesAgo);
      expect(result).toContain('5 minutes ago');
    });

    it('should return hours ago', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const result = getRelativeTime(twoHoursAgo);
      expect(result).toContain('2 hours ago');
    });

    it('should return days ago', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const result = getRelativeTime(threeDaysAgo);
      expect(result).toContain('3 days ago');
    });

    it('should return "Invalid Date" for invalid input', () => {
      const result = getRelativeTime('invalid');
      expect(result).toBe('Invalid Date');
    });

    it('should handle singular forms', () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const result = getRelativeTime(oneHourAgo);
      expect(result).toBe('1 hour ago');
    });
  });

  /* ==================== URL UTILITIES ==================== */

  describe('buildUrl', () => {
    it('should build URL without params', () => {
      const result = buildUrl('https://example.com', '/api/users');
      expect(result).toBe('https://example.com/api/users');
    });

    it('should build URL with params', () => {
      const result = buildUrl('https://example.com', '/search', {
        q: 'test',
        page: '1',
      });
      expect(result).toContain('q=test');
      expect(result).toContain('page=1');
    });

    it('should handle trailing slashes', () => {
      const result = buildUrl('https://example.com/', '/path');
      expect(result).toBe('https://example.com/path');
    });
  });

  describe('withBasePath', () => {
    it('should return base path for empty input', () => {
      const result = withBasePath('');
      expect(result).toBeTruthy();
    });

    it('should collapse leading slashes and keep base once', () => {
      expect(withBasePath('/blog')).toBe('/blog');
      expect(withBasePath('//blog')).toBe('//blog'); // protocol-relative URLs remain untouched
    });

    it('should not modify external URLs', () => {
      expect(withBasePath('https://google.com')).toBe('https://google.com');
      expect(withBasePath('http://example.com')).toBe('http://example.com');
    });

    it('should not modify mailto links', () => {
      expect(withBasePath('mailto:test@example.com')).toBe(
        'mailto:test@example.com'
      );
    });

    it('should not modify tel links', () => {
      expect(withBasePath('tel:+1234567890')).toBe('tel:+1234567890');
    });

    it('should not modify hash links', () => {
      expect(withBasePath('#section')).toBe('#section');
    });

    it('should leave query-only paths alone', () => {
      expect(withBasePath('?q=test')).toBe('?q=test');
    });

    it('should handle relative paths', () => {
      const result = withBasePath('about');
      expect(result).toContain('about');
    });

    it('should use custom BASE_PATH when provided', async () => {
      const originalBase = process.env.BASE_PATH;
      process.env.BASE_PATH = '/docs/';
      vi.resetModules();
      const { withBasePath: withDocsBase } = await import('../utils/helpers');

      expect(withDocsBase('blog/')).toBe('/docs/blog/');
      expect(withDocsBase('')).toBe('/docs/');

      if (originalBase === undefined) {
        delete process.env.BASE_PATH;
      } else {
        process.env.BASE_PATH = originalBase;
      }
      vi.resetModules();
    });
  });

  /* ==================== STRING UTILITIES ==================== */

  describe('getSlugFromTitle', () => {
    it('should convert title to slug', () => {
      expect(getSlugFromTitle('Hello World')).toBe('hello-world');
    });

    it('should remove special characters', () => {
      expect(getSlugFromTitle("What's New in 2024?")).toBe('whats-new-in-2024');
    });

    it('should handle multiple spaces', () => {
      expect(getSlugFromTitle('Multiple   Spaces   Here')).toBe(
        'multiple-spaces-here'
      );
    });

    it('should remove leading/trailing dashes', () => {
      expect(getSlugFromTitle('  Test  ')).toBe('test');
    });

    it('should handle underscores', () => {
      expect(getSlugFromTitle('snake_case_title')).toBe('snake-case-title');
    });
  });

  describe('truncateText', () => {
    it('should not truncate short text', () => {
      expect(truncateText('Hello', 10)).toBe('Hello');
    });

    it('should truncate long text with default suffix', () => {
      expect(truncateText('Hello World Everyone', 10)).toBe('Hello...');
    });

    it('should use custom suffix', () => {
      expect(truncateText('Hello World Everyone', 12, '…')).toBe(
        'Hello World…'
      );
    });

    it('should handle exact length', () => {
      expect(truncateText('Hello', 5)).toBe('Hello');
    });
  });

  describe('capitalizeFirst', () => {
    it('should capitalize first letter', () => {
      expect(capitalizeFirst('hello')).toBe('Hello');
    });

    it('should handle empty string', () => {
      expect(capitalizeFirst('')).toBe('');
    });

    it('should not change already capitalized', () => {
      expect(capitalizeFirst('Hello')).toBe('Hello');
    });

    it('should only capitalize first letter', () => {
      expect(capitalizeFirst('hELLO')).toBe('HELLO');
    });
  });

  describe('capitalizeWords', () => {
    it('should capitalize each word', () => {
      expect(capitalizeWords('hello world')).toBe('Hello World');
    });

    it('should handle single word', () => {
      expect(capitalizeWords('hello')).toBe('Hello');
    });

    it('should handle empty string', () => {
      expect(capitalizeWords('')).toBe('');
    });
  });

  /* ==================== ARRAY UTILITIES ==================== */

  describe('groupBy', () => {
    it('should group items by key', () => {
      const items = [
        { category: 'A', name: 'Item 1' },
        { category: 'B', name: 'Item 2' },
        { category: 'A', name: 'Item 3' },
      ];
      const result = groupBy(items, 'category');

      expect(result['A']).toHaveLength(2);
      expect(result['B']).toHaveLength(1);
    });

    it('should handle empty array', () => {
      const result = groupBy([], 'key' as never);
      expect(result).toEqual({});
    });
  });

  describe('sortBy', () => {
    it('should sort ascending by default', () => {
      const items = [{ value: 3 }, { value: 1 }, { value: 2 }];
      const result = sortBy(items, 'value');

      expect(result[0].value).toBe(1);
      expect(result[1].value).toBe(2);
      expect(result[2].value).toBe(3);
    });

    it('should sort descending when specified', () => {
      const items = [{ value: 1 }, { value: 3 }, { value: 2 }];
      const result = sortBy(items, 'value', 'desc');

      expect(result[0].value).toBe(3);
      expect(result[1].value).toBe(2);
      expect(result[2].value).toBe(1);
    });

    it('should not mutate original array', () => {
      const items = [{ value: 2 }, { value: 1 }];
      sortBy(items, 'value');

      expect(items[0].value).toBe(2);
    });

    it('should handle equal values', () => {
      const items = [{ value: 1 }, { value: 1 }];
      const result = sortBy(items, 'value');

      expect(result).toHaveLength(2);
    });
  });

  describe('unique', () => {
    it('should remove duplicates', () => {
      expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
    });

    it('should handle empty array', () => {
      expect(unique([])).toEqual([]);
    });

    it('should handle strings', () => {
      expect(unique(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
    });

    it('should preserve order of first occurrence', () => {
      expect(unique([3, 1, 2, 1, 3])).toEqual([3, 1, 2]);
    });
  });

  describe('chunk', () => {
    it('should split array into chunks', () => {
      expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    });

    it('should handle empty array', () => {
      expect(chunk([], 3)).toEqual([]);
    });

    it('should handle chunk size larger than array', () => {
      expect(chunk([1, 2], 5)).toEqual([[1, 2]]);
    });

    it('should handle exact division', () => {
      expect(chunk([1, 2, 3, 4], 2)).toEqual([
        [1, 2],
        [3, 4],
      ]);
    });
  });
});
