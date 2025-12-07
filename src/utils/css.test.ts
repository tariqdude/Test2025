import { describe, it, expect } from 'vitest';
import { cn, cssVariables, toStyleString, parseStyleString } from './css';

describe('CSS Utilities', () => {
  describe('cn', () => {
    it('should combine class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('should ignore falsy values', () => {
      expect(cn('foo', undefined, null, false, 'bar')).toBe('foo bar');
    });

    it('should handle empty input', () => {
      expect(cn()).toBe('');
    });
  });

  describe('cssVariables', () => {
    it('should generate CSS variables', () => {
      const vars = {
        color: 'red',
        spacing: '10px',
        opacity: 0.5,
      };
      expect(cssVariables(vars)).toEqual({
        '--color': 'red',
        '--spacing': '10px',
        '--opacity': '0.5',
      });
    });
  });

  describe('toStyleString', () => {
    it('should convert object to style string', () => {
      const styles = {
        color: 'red',
        backgroundColor: 'blue',
        fontSize: '16px',
      };
      expect(toStyleString(styles)).toBe(
        'color: red; background-color: blue; font-size: 16px'
      );
    });

    it('should ignore undefined/null/empty values', () => {
      const styles = {
        color: 'red',
        background: undefined,
        border: null,
        margin: '',
      };
      // @ts-expect-error - Testing runtime behavior for null
      expect(toStyleString(styles)).toBe('color: red');
    });
  });

  describe('parseStyleString', () => {
    it('should parse style string to object', () => {
      const style = 'color: red; background-color: blue; font-size: 16px';
      expect(parseStyleString(style)).toEqual({
        color: 'red',
        backgroundColor: 'blue',
        fontSize: '16px',
      });
    });

    it('should handle whitespace', () => {
      const style = '  color : red ;  background-color  :  blue  ';
      expect(parseStyleString(style)).toEqual({
        color: 'red',
        backgroundColor: 'blue',
      });
    });

    it('should handle empty string', () => {
      expect(parseStyleString('')).toEqual({});
    });
  });
});
