import { describe, it, expect } from 'vitest';
import {
  formatNumber,
  formatFileSize,
  formatCurrency,
  formatPercent,
  formatCompact,
  formatWithUnit,
  formatOrdinal,
} from './format';

describe('Format Utilities', () => {
  describe('formatNumber', () => {
    it('should format numbers with default locale', () => {
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1234.56)).toBe('1,234.56');
    });

    it('should format numbers with custom locale', () => {
      expect(formatNumber(1000, {}, 'de-DE')).toBe('1.000');
      expect(formatNumber(1234.56, {}, 'de-DE')).toBe('1.234,56');
    });

    it('should format numbers with options', () => {
      expect(formatNumber(1234.5678, { maximumFractionDigits: 2 })).toBe(
        '1,234.57'
      );
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
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
    });

    it('should format GB', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should respect decimals', () => {
      expect(formatFileSize(1536, 0)).toBe('2 KB');
      expect(formatFileSize(1536, 2)).toBe('1.5 KB');
    });
  });

  describe('formatCurrency', () => {
    it('should format USD by default', () => {
      expect(formatCurrency(1000)).toContain('$');
      expect(formatCurrency(1000)).toContain('1,000');
    });

    it('should format other currencies', () => {
      const eur = formatCurrency(1000, 'EUR', 'de-DE');
      expect(eur).toContain('€');
      expect(eur).toContain('1.000');
    });
  });

  describe('formatPercent', () => {
    it('should format percentage', () => {
      expect(formatPercent(0.5)).toBe('50%');
      expect(formatPercent(0.123)).toBe('12%');
    });

    it('should respect decimals', () => {
      expect(formatPercent(0.1234, 2)).toBe('12.34%');
    });
  });

  describe('formatCompact', () => {
    it('should format compact numbers', () => {
      expect(formatCompact(1000)).toBe('1K');
      expect(formatCompact(1500)).toBe('1.5K');
      expect(formatCompact(1000000)).toBe('1M');
    });
  });

  describe('formatWithUnit', () => {
    it('should format with unit in compact mode', () => {
      expect(formatWithUnit(1500, 'downloads')).toBe('1.5K downloads');
    });

    it('should format with unit in standard mode', () => {
      expect(formatWithUnit(1500, 'downloads', { compact: false })).toBe(
        '1,500 downloads'
      );
    });
  });

  describe('formatOrdinal', () => {
    it('should format ordinals', () => {
      expect(formatOrdinal(1)).toBe('1st');
      expect(formatOrdinal(2)).toBe('2nd');
      expect(formatOrdinal(3)).toBe('3rd');
      expect(formatOrdinal(4)).toBe('4th');
      expect(formatOrdinal(11)).toBe('11th');
      expect(formatOrdinal(12)).toBe('12th');
      expect(formatOrdinal(13)).toBe('13th');
      expect(formatOrdinal(21)).toBe('21st');
      expect(formatOrdinal(22)).toBe('22nd');
      expect(formatOrdinal(23)).toBe('23rd');
    });
  });
});
