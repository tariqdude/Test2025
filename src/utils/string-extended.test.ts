import { describe, it, expect } from 'vitest';
import {
  toOrdinal,
  highlightTerms,
  formatBytes,
  parseTemplate,
  normalizeText,
  pluralize,
  wordCount,
  maskString,
  levenshteinDistance,
  stringSimilarity,
} from './string';

describe('Extended String Utilities', () => {
  describe('toOrdinal', () => {
    it('should convert numbers to ordinal format', () => {
      expect(toOrdinal(1)).toBe('1st');
      expect(toOrdinal(2)).toBe('2nd');
      expect(toOrdinal(3)).toBe('3rd');
      expect(toOrdinal(4)).toBe('4th');
      expect(toOrdinal(11)).toBe('11th');
      expect(toOrdinal(12)).toBe('12th');
      expect(toOrdinal(13)).toBe('13th');
      expect(toOrdinal(21)).toBe('21st');
      expect(toOrdinal(22)).toBe('22nd');
      expect(toOrdinal(23)).toBe('23rd');
      expect(toOrdinal(100)).toBe('100th');
      expect(toOrdinal(101)).toBe('101st');
    });
  });

  describe('highlightTerms', () => {
    it('should wrap search terms with mark tag', () => {
      expect(highlightTerms('Hello World', 'World')).toBe(
        'Hello <mark>World</mark>'
      );
    });

    it('should handle multiple terms', () => {
      const result = highlightTerms('Hello World Test', ['World', 'Test']);
      expect(result).toBe('Hello <mark>World</mark> <mark>Test</mark>');
    });

    it('should use custom tag', () => {
      expect(highlightTerms('Hello World', 'World', 'strong')).toBe(
        'Hello <strong>World</strong>'
      );
    });

    it('should handle case insensitive matching', () => {
      expect(highlightTerms('Hello WORLD', 'world')).toBe(
        'Hello <mark>WORLD</mark>'
      );
    });

    it('should return original text for empty terms', () => {
      expect(highlightTerms('Hello World', '')).toBe('Hello World');
      expect(highlightTerms('Hello World', [])).toBe('Hello World');
    });
  });

  describe('formatBytes', () => {
    it('should format bytes to human readable format', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1048576)).toBe('1 MB');
      expect(formatBytes(1073741824)).toBe('1 GB');
    });

    it('should handle decimal places', () => {
      expect(formatBytes(1500, 2)).toBe('1.46 KB');
      expect(formatBytes(1500, 0)).toBe('1 KB');
    });

    it('should handle negative bytes', () => {
      expect(formatBytes(-1024)).toBe('-1 KB');
    });
  });

  describe('parseTemplate', () => {
    it('should replace variables in template', () => {
      expect(parseTemplate('Hello {{name}}!', { name: 'World' })).toBe(
        'Hello World!'
      );
    });

    it('should handle multiple variables', () => {
      const template = '{{greeting}} {{name}}, you have {{count}} messages';
      const result = parseTemplate(template, {
        greeting: 'Hi',
        name: 'John',
        count: 5,
      });
      expect(result).toBe('Hi John, you have 5 messages');
    });

    it('should keep undefined variables as-is', () => {
      expect(parseTemplate('Hello {{name}}!', {})).toBe('Hello {{name}}!');
    });

    it('should handle empty template', () => {
      expect(parseTemplate('', { name: 'test' })).toBe('');
    });
  });

  describe('normalizeText', () => {
    it('should normalize whitespace', () => {
      expect(normalizeText('Hello   World')).toBe('Hello World');
    });

    it('should normalize line endings', () => {
      expect(normalizeText('Hello\r\nWorld')).toBe('Hello\nWorld');
      expect(normalizeText('Hello\rWorld')).toBe('Hello\nWorld');
    });

    it('should collapse multiple newlines', () => {
      expect(normalizeText('Hello\n\n\n\nWorld')).toBe('Hello\n\nWorld');
    });
  });

  describe('pluralize', () => {
    it('should return singular for count of 1', () => {
      expect(pluralize('item', 1)).toBe('item');
    });

    it('should add s for regular plurals', () => {
      expect(pluralize('item', 2)).toBe('items');
    });

    it('should handle words ending in y', () => {
      expect(pluralize('city', 2)).toBe('cities');
      expect(pluralize('day', 2)).toBe('days'); // vowel + y
    });

    it('should handle sibilants', () => {
      expect(pluralize('box', 2)).toBe('boxes');
      expect(pluralize('church', 2)).toBe('churches');
    });

    it('should use custom plural form', () => {
      expect(pluralize('child', 2, 'children')).toBe('children');
    });
  });

  describe('wordCount', () => {
    it('should count words in a string', () => {
      expect(wordCount('Hello World')).toBe(2);
      expect(wordCount('One two three four five')).toBe(5);
    });

    it('should handle multiple spaces', () => {
      expect(wordCount('Hello    World')).toBe(2);
    });

    it('should return 0 for empty string', () => {
      expect(wordCount('')).toBe(0);
    });
  });

  describe('maskString', () => {
    it('should mask middle of string', () => {
      expect(maskString('1234567890', 3, 3)).toBe('123****890');
    });

    it('should mask email', () => {
      const result = maskString('john@example.com', 3, 4);
      expect(result.startsWith('joh')).toBe(true);
      expect(result.endsWith('.com')).toBe(true);
      expect(result.includes('*')).toBe(true);
    });

    it('should handle short strings', () => {
      expect(maskString('abc', 3, 3)).toBe('***');
    });
  });

  describe('levenshteinDistance', () => {
    it('should calculate edit distance', () => {
      expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
      expect(levenshteinDistance('hello', 'hello')).toBe(0);
      expect(levenshteinDistance('', 'test')).toBe(4);
    });
  });

  describe('stringSimilarity', () => {
    it('should calculate similarity percentage', () => {
      expect(stringSimilarity('hello', 'hello')).toBe(100);
      expect(stringSimilarity('hello', 'hallo')).toBe(80);
      expect(stringSimilarity('', '')).toBe(100);
    });
  });
});
