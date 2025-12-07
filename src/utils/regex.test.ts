/**
 * Regex Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import {
  RegexBuilder,
  patterns,
  escape,
  isMatch,
  findAll,
  replaceAll,
  extractGroups,
  split,
  test,
  createPattern,
  combine,
  createValidator,
} from './regex';

describe('Regex Utilities', () => {
  describe('RegexBuilder', () => {
    it('should build basic pattern', () => {
      const regex = new RegexBuilder()
        .literal('hello')
        .build();
      expect(regex.test('hello world')).toBe(true);
      expect(regex.test('goodbye')).toBe(false);
    });

    it('should add anchors', () => {
      const regex = new RegexBuilder()
        .startOfString()
        .literal('hello')
        .endOfString()
        .build();
      expect(regex.test('hello')).toBe(true);
      expect(regex.test('say hello')).toBe(false);
    });

    it('should add character classes', () => {
      const regex = new RegexBuilder()
        .digit()
        .digit()
        .digit()
        .build();
      expect(regex.test('123')).toBe(true);
      expect(regex.test('abc')).toBe(false);
    });

    it('should add quantifiers', () => {
      const regex = new RegexBuilder()
        .literal('a')
        .oneOrMore()
        .build();
      expect(regex.test('aaa')).toBe(true);
      expect(regex.test('b')).toBe(false);
    });

    it('should add groups', () => {
      const regex = new RegexBuilder()
        .group(b => b.literal('hello'))
        .build();
      expect(regex.test('hello')).toBe(true);
    });

    it('should add named groups', () => {
      const regex = new RegexBuilder()
        .namedGroup('word', b => b.word())
        .build();
      const match = 'hello'.match(regex);
      expect(match?.groups?.word).toBe('hello');
    });

    it('should support alternation', () => {
      const regex = new RegexBuilder()
        .either(
          b => b.literal('cat'),
          b => b.literal('dog')
        )
        .build();
      expect(regex.test('cat')).toBe(true);
      expect(regex.test('dog')).toBe(true);
      expect(regex.test('bird')).toBe(false);
    });

    it('should support character sets', () => {
      const regex = new RegexBuilder()
        .charSet('aeiou')
        .build();
      expect(regex.test('a')).toBe(true);
      expect(regex.test('b')).toBe(false);
    });

    it('should support negated character sets', () => {
      const regex = new RegexBuilder()
        .charSetNegated('aeiou')
        .build();
      expect(regex.test('b')).toBe(true);
      expect(regex.test('a')).toBe(false);
    });

    it('should support ranges', () => {
      const regex = new RegexBuilder()
        .range('a', 'z')
        .build();
      expect(regex.test('m')).toBe(true);
      expect(regex.test('M')).toBe(false);
    });

    it('should support exact repetition', () => {
      const regex = new RegexBuilder()
        .digit()
        .exactly(3)
        .build();
      expect(regex.test('123')).toBe(true);
    });

    it('should support range repetition', () => {
      const regex = new RegexBuilder()
        .digit()
        .between(2, 4)
        .build();
      expect(regex.test('12')).toBe(true);
      expect(regex.test('1234')).toBe(true);
      expect(regex.test('1')).toBe(false);
    });

    it('should support optional elements', () => {
      const regex = new RegexBuilder()
        .literal('colour')
        .literal('s')
        .optional()
        .build();
      expect(regex.test('colour')).toBe(true);
      expect(regex.test('colours')).toBe(true);
    });

    it('should support lazy quantifiers', () => {
      const regex = new RegexBuilder()
        .literal('<')
        .any()
        .oneOrMore()
        .lazy()
        .literal('>')
        .build('g');
      const matches = '<a><b>'.match(regex);
      expect(matches).toHaveLength(2);
    });

    it('should support lookahead', () => {
      const regex = new RegexBuilder()
        .literal('foo')
        .lookahead(b => b.literal('bar'))
        .build();
      expect(regex.test('foobar')).toBe(true);
      expect(regex.test('foobaz')).toBe(false);
    });

    it('should support negative lookahead', () => {
      const regex = new RegexBuilder()
        .literal('foo')
        .negativeLookahead(b => b.literal('bar'))
        .build();
      expect(regex.test('foobaz')).toBe(true);
      expect(regex.test('foobar')).toBe(false);
    });

    it('should support lookbehind', () => {
      const regex = new RegexBuilder()
        .lookbehind(b => b.literal('$'))
        .digit()
        .oneOrMore()
        .build();
      expect(regex.test('$100')).toBe(true);
      expect(regex.test('100')).toBe(false);
    });

    it('should chain operations', () => {
      const regex = new RegexBuilder()
        .startOfString()
        .literal('Hello')
        .whitespace()
        .word()
        .oneOrMore()
        .literal('!')
        .endOfString()
        .build();
      expect(regex.test('Hello World!')).toBe(true);
    });

    it('should handle word boundaries', () => {
      const regex = new RegexBuilder()
        .wordBoundary()
        .literal('cat')
        .wordBoundary()
        .build();
      expect(regex.test('the cat sat')).toBe(true);
      expect(regex.test('concatenate')).toBe(false);
    });
  });

  describe('Predefined Patterns', () => {
    it('should validate email', () => {
      expect(patterns.email.test('user@example.com')).toBe(true);
      expect(patterns.email.test('invalid')).toBe(false);
    });

    it('should validate URL', () => {
      expect(patterns.url.test('https://example.com')).toBe(true);
      expect(patterns.url.test('ftp://files.example.com')).toBe(true);
      expect(patterns.url.test('not-a-url')).toBe(false);
    });

    it('should validate phone numbers', () => {
      expect(patterns.phone.test('123-456-7890')).toBe(true);
      expect(patterns.phone.test('(123) 456-7890')).toBe(true);
    });

    it('should validate dates', () => {
      expect(patterns.dateISO.test('2024-01-15')).toBe(true);
      expect(patterns.dateUS.test('01/15/2024')).toBe(true);
      expect(patterns.dateEU.test('15.01.2024')).toBe(true);
    });

    it('should validate time', () => {
      expect(patterns.time24.test('14:30')).toBe(true);
      expect(patterns.time12.test('2:30 PM')).toBe(true);
    });

    it('should validate IP addresses', () => {
      expect(patterns.ipv4.test('192.168.1.1')).toBe(true);
      expect(patterns.ipv4.test('256.1.1.1')).toBe(false);
    });

    it('should validate hex colors', () => {
      expect(patterns.hexColor.test('#fff')).toBe(true);
      expect(patterns.hexColor.test('#ffffff')).toBe(true);
      expect(patterns.hexColor.test('#gggggg')).toBe(false);
    });

    it('should validate credit card numbers', () => {
      expect(patterns.creditCard.test('4111111111111111')).toBe(true);
      expect(patterns.creditCard.test('4111-1111-1111-1111')).toBe(true);
    });

    it('should validate slugs', () => {
      expect(patterns.slug.test('hello-world')).toBe(true);
      expect(patterns.slug.test('Hello World')).toBe(false);
    });

    it('should validate UUIDs', () => {
      expect(patterns.uuid.test('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('should validate JWT tokens', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
      expect(patterns.jwt.test(token)).toBe(true);
    });

    it('should validate semantic versions', () => {
      expect(patterns.semver.test('1.0.0')).toBe(true);
      expect(patterns.semver.test('1.0.0-alpha')).toBe(true);
      expect(patterns.semver.test('1.0.0-alpha+build')).toBe(true);
    });

    it('should match hashtags', () => {
      const text = 'Hello #world #test123';
      const matches = text.match(patterns.hashtag);
      expect(matches).toContain('#world');
      expect(matches).toContain('#test123');
    });

    it('should match mentions', () => {
      const text = 'Hello @user @test123';
      const matches = text.match(patterns.mention);
      expect(matches).toContain('@user');
      expect(matches).toContain('@test123');
    });
  });

  describe('Utility Functions', () => {
    it('should escape special characters', () => {
      const escaped = escape('hello.world?');
      expect(escaped).toBe('hello\\.world\\?');
    });

    it('should check match', () => {
      expect(isMatch('hello', /hello/)).toBe(true);
      expect(isMatch('world', /hello/)).toBe(false);
    });

    it('should find all matches', () => {
      const matches = findAll('a1b2c3', /\d/g);
      expect(matches).toEqual(['1', '2', '3']);
    });

    it('should replace all', () => {
      const result = replaceAll('hello world', /o/g, '0');
      expect(result).toBe('hell0 w0rld');
    });

    it('should replace with function', () => {
      const result = replaceAll('hello', /[a-z]/g, c => c.toUpperCase());
      expect(result).toBe('HELLO');
    });

    it('should extract groups', () => {
      const groups = extractGroups('John: 30', /(\w+): (\d+)/);
      expect(groups).toEqual(['John', '30']);
    });

    it('should extract named groups', () => {
      const groups = extractGroups(
        'John: 30',
        /(?<name>\w+): (?<age>\d+)/
      );
      expect(groups).toHaveProperty('name', 'John');
      expect(groups).toHaveProperty('age', '30');
    });

    it('should split string', () => {
      const parts = split('a,b;c', /[,;]/);
      expect(parts).toEqual(['a', 'b', 'c']);
    });

    it('should split with limit', () => {
      const parts = split('a,b,c,d', /,/, 2);
      expect(parts).toEqual(['a', 'b']);
    });

    it('should test pattern', () => {
      expect(test('hello', /^hello$/)).toBe(true);
      expect(test('hello world', /^hello$/)).toBe(false);
    });

    it('should create pattern from string', () => {
      const regex = createPattern('hello.*world', 'i');
      expect(regex.test('Hello Wonderful World')).toBe(true);
    });

    it('should combine patterns', () => {
      const combined = combine([/hello/, /world/]);
      expect(combined.source).toContain('hello');
      expect(combined.source).toContain('world');
    });

    it('should create validator', () => {
      const isEmail = createValidator(patterns.email);
      expect(isEmail('user@example.com')).toBe(true);
      expect(isEmail('invalid')).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty strings', () => {
      expect(isMatch('', /^$/)).toBe(true);
      expect(findAll('', /./g)).toEqual([]);
    });

    it('should handle unicode', () => {
      const regex = new RegexBuilder()
        .literal('こんにちは')
        .build();
      expect(regex.test('こんにちは世界')).toBe(true);
    });

    it('should handle newlines', () => {
      const regex = new RegexBuilder()
        .any()
        .oneOrMore()
        .build('s');
      expect(regex.test('hello\nworld')).toBe(true);
    });

    it('should handle special regex characters in literal', () => {
      const regex = new RegexBuilder()
        .literal('1+1=2')
        .build();
      expect(regex.test('1+1=2')).toBe(true);
    });
  });
});
