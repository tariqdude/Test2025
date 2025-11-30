import { describe, it, expect } from 'vitest';
import { formatCurrency, formatCompactNumber } from './formatters';

describe('formatters', () => {
  describe('formatCurrency', () => {
    it('formats USD by default', () => {
      // Note: Exact output depends on the environment's locale implementation (Node vs Browser)
      // We check for the presence of the currency symbol and the number
      const result = formatCurrency(1000);
      expect(result).toContain('$');
      expect(result).toContain('1,000');
    });

    it('formats other currencies', () => {
      const result = formatCurrency(1000, 'EUR');
      // Check for Euro symbol
      expect(result).toMatch(/€|EUR/);
      expect(result).toContain('1,000');
    });
  });

  describe('formatCompactNumber', () => {
    it('formats thousands', () => {
      expect(formatCompactNumber(1200)).toBe('1.2K');
    });

    it('formats millions', () => {
      expect(formatCompactNumber(1500000)).toBe('1.5M');
    });

    it('formats small numbers', () => {
      expect(formatCompactNumber(123)).toBe('123');
    });
  });
});
