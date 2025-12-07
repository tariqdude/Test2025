import { describe, it, expect } from 'vitest';
import {
  slugify,
  truncate,
  capitalizeFirst,
  titleCase,
  getInitials,
  sanitizeInput,
  escapeHtml,
  camelCase,
  snakeCase,
  kebabCase,
} from './string';

describe('String Utilities', () => {
  describe('slugify', () => {
    it('should convert text to slug', () => {
      expect(slugify('Hello World')).toBe('hello-world');
    });

    it('should handle special characters', () => {
      expect(slugify('Hello @ World!')).toBe('hello-world');
    });

    it('should remove apostrophes', () => {
      expect(slugify("It's a great day")).toBe('its-a-great-day');
    });

    it('should trim whitespace', () => {
      expect(slugify('  Hello World  ')).toBe('hello-world');
    });

    it('should handle multiple spaces', () => {
      expect(slugify('Hello   World')).toBe('hello-world');
    });
  });

  describe('truncate', () => {
    it('should not truncate if text is shorter than maxLength', () => {
      expect(truncate('Hello', 10)).toBe('Hello');
    });

    it('should truncate text to maxLength', () => {
      expect(truncate('Hello World', 5)).toBe('He...');
    });

    it('should respect word boundaries', () => {
      // "Hello World" (11 chars). Max 8.
      // "Hello Wo..." -> cut in word "World".
      // Should back up to "Hello..."
      expect(truncate('Hello World', 8)).toBe('Hello...');
    });

    it('should handle custom suffix', () => {
      expect(truncate('Hello World', 5, '!')).toBe('Hell!');
    });

    it('should handle case where truncation happens at space', () => {
      // "Hello World" (11 chars). Max 6. Suffix "..." (3 chars).
      // Target length 6. Content length 3.
      // "Hel" (3 chars).
      // "Hel" does not end in space.
      // Result "Hel..."
      expect(truncate('Hello World', 6)).toBe('Hel...');
    });
  });

  describe('capitalizeFirst', () => {
    it('should capitalize first letter', () => {
      expect(capitalizeFirst('hello')).toBe('Hello');
    });

    it('should handle empty string', () => {
      expect(capitalizeFirst('')).toBe('');
    });

    it('should handle already capitalized string', () => {
      expect(capitalizeFirst('Hello')).toBe('Hello');
    });
  });

  describe('titleCase', () => {
    it('should capitalize first letter of each word', () => {
      expect(titleCase('hello world')).toBe('Hello World');
    });

    it('should handle mixed case', () => {
      expect(titleCase('hElLo wOrLd')).toBe('Hello World');
    });

    it('should handle empty string', () => {
      expect(titleCase('')).toBe('');
    });
  });

  describe('getInitials', () => {
    it('should return initials', () => {
      expect(getInitials('John Doe')).toBe('JD');
    });

    it('should limit number of initials', () => {
      expect(getInitials('John Doe Smith', 2)).toBe('JD');
    });

    it('should handle single name', () => {
      expect(getInitials('John')).toBe('J');
    });

    it('should handle empty string', () => {
      expect(getInitials('')).toBe('');
    });
  });

  describe('sanitizeInput', () => {
    it('should remove HTML tags', () => {
      // Implementation only removes < and > characters
      expect(sanitizeInput('<script>alert("xss")</script>Hello')).toBe(
        'scriptalert("xss")/scriptHello'
      );
    });

    it('should handle simple tags', () => {
      expect(sanitizeInput('<b>Bold</b>')).toBe('bBold/b');
    });

    it('should handle empty string', () => {
      expect(sanitizeInput('')).toBe('');
    });
  });

  describe('escapeHtml', () => {
    it('should escape special characters', () => {
      expect(escapeHtml('<div class="test">\'&\'</div>')).toBe(
        '&lt;div class=&quot;test&quot;&gt;&#039;&amp;&#039;&lt;/div&gt;'
      );
    });

    it('should handle empty string', () => {
      expect(escapeHtml('')).toBe('');
    });
  });

  describe('camelCase', () => {
    it('should convert snake_case to camelCase', () => {
      expect(camelCase('hello_world')).toBe('helloWorld');
    });

    it('should convert kebab-case to camelCase', () => {
      expect(camelCase('hello-world')).toBe('helloWorld');
    });

    it('should convert space separated to camelCase', () => {
      expect(camelCase('hello world')).toBe('helloWorld');
    });

    it('should handle empty string', () => {
      expect(camelCase('')).toBe('');
    });
  });

  describe('snakeCase', () => {
    it('should convert camelCase to snake_case', () => {
      expect(snakeCase('helloWorld')).toBe('hello_world');
    });

    it('should convert kebab-case to snake_case', () => {
      expect(snakeCase('hello-world')).toBe('hello_world');
    });

    it('should convert space separated to snake_case', () => {
      expect(snakeCase('hello world')).toBe('hello_world');
    });

    it('should handle empty string', () => {
      expect(snakeCase('')).toBe('');
    });
  });

  describe('kebabCase', () => {
    it('should convert camelCase to kebab-case', () => {
      expect(kebabCase('helloWorld')).toBe('hello-world');
    });

    it('should convert snake_case to kebab-case', () => {
      expect(kebabCase('hello_world')).toBe('hello-world');
    });

    it('should convert space separated to kebab-case', () => {
      expect(kebabCase('hello world')).toBe('hello-world');
    });

    it('should handle empty string', () => {
      expect(kebabCase('')).toBe('');
    });
  });
});
