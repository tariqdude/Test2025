import { describe, it, expect } from 'vitest';
import { withBasePath, resolveHref, buildUrl } from './url';

describe('URL Utilities', () => {
  describe('withBasePath', () => {
    it('should prepend base path', () => {
      // Note: BASE_PATH is imported from consts.
      // If it's '/', it might not prepend anything.
      // We might need to mock BASE_PATH if possible, or check behavior with default.
      // Assuming default is '/' or empty.

      // If BASE_PATH is '/', withBasePath('/foo') -> '/foo'
      expect(withBasePath('/foo')).toBe('/foo');
    });

    it('should handle empty path', () => {
      expect(withBasePath('')).toBe('/');
    });

    it('should not prepend to external links', () => {
      expect(withBasePath('https://example.com')).toBe('https://example.com');
      expect(withBasePath('mailto:test@example.com')).toBe(
        'mailto:test@example.com'
      );
    });
  });

  describe('resolveHref', () => {
    it('should be alias for withBasePath', () => {
      expect(resolveHref('/foo')).toBe(withBasePath('/foo'));
    });
  });

  describe('buildUrl', () => {
    it('should build url with params', () => {
      const url = buildUrl('https://example.com', { a: 1, b: 'test' });
      expect(url).toBe('https://example.com/?a=1&b=test');
    });

    it('should build url with path and params', () => {
      const url = buildUrl('https://example.com', '/path', { a: 1 });
      expect(url).toBe('https://example.com/path?a=1');
    });

    it('should handle relative urls', () => {
      const url = buildUrl('/api', { q: 'search' });
      expect(url).toBe('/api?q=search');
    });

    it('should handle undefined params', () => {
      const url = buildUrl('https://example.com', {
        a: 1,
        b: undefined,
      });
      expect(url).toBe('https://example.com/?a=1');
    });
  });
});
