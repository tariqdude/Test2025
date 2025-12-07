import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import {
  formatDate,
  formatRelativeTime,
  getRelativeTime,
  parseDate,
  isValidDate,
  startOfDay,
} from './date';

describe('Date Utilities', () => {
  describe('formatDate', () => {
    it('should format date correctly with default options', () => {
      const date = new Date('2023-01-15T12:00:00Z');
      // Force UTC for deterministic testing
      const result = formatDate(date, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
      });
      expect(result).toContain('January');
      expect(result).toContain('15');
      expect(result).toContain('2023');
    });

    it('should format date with custom options', () => {
      const date = new Date('2023-01-15T12:00:00Z');
      const result = formatDate(
        date,
        { year: '2-digit', month: 'short', day: 'numeric', timeZone: 'UTC' },
        'en-US'
      );
      expect(result).toMatch(/Jan 15, 23/);
    });

    it('should handle invalid dates', () => {
      expect(formatDate('invalid-date')).toBe('Invalid Date');
    });

    it('should handle string input', () => {
      // Use a date that is safe across timezones or specify timezone
      const result = formatDate('2023-01-15T12:00:00Z', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
      });
      expect(result).toContain('January');
      expect(result).toContain('15');
      expect(result).toContain('2023');
    });

    it('should handle number input (timestamp)', () => {
      const timestamp = new Date('2023-01-15T12:00:00Z').getTime();
      const result = formatDate(timestamp, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
      });
      expect(result).toContain('January');
      expect(result).toContain('15');
      expect(result).toContain('2023');
    });
  });

  describe('formatRelativeTime', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2023-01-01T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return "Just now" for very recent times', () => {
      const now = new Date('2023-01-01T12:00:00Z');
      expect(formatRelativeTime(now)).toBe('Just now');

      const fiveSecondsAgo = new Date('2023-01-01T11:59:55Z');
      expect(formatRelativeTime(fiveSecondsAgo)).toBe('Just now');
    });

    it('should format seconds ago', () => {
      const date = new Date('2023-01-01T11:59:40Z'); // 20 seconds ago
      expect(formatRelativeTime(date)).toBe('20 seconds ago');
    });

    it('should format minutes ago', () => {
      const date = new Date('2023-01-01T11:55:00Z'); // 5 minutes ago
      expect(formatRelativeTime(date)).toBe('5 minutes ago');
    });

    it('should format hours ago', () => {
      const date = new Date('2023-01-01T09:00:00Z'); // 3 hours ago
      expect(formatRelativeTime(date)).toBe('3 hours ago');
    });

    it('should format days ago', () => {
      const date = new Date('2022-12-30T12:00:00Z'); // 2 days ago
      expect(formatRelativeTime(date)).toBe('2 days ago');
    });

    it('should format future times', () => {
      const date = new Date('2023-01-01T12:05:00Z'); // in 5 minutes
      expect(formatRelativeTime(date)).toBe('in 5 minutes');
    });

    it('should handle invalid dates', () => {
      expect(formatRelativeTime('invalid')).toBe('Invalid Date');
    });

    it('should be aliased as getRelativeTime', () => {
      const date = new Date('2023-01-01T11:55:00Z'); // 5 minutes ago
      expect(getRelativeTime(date)).toBe('5 minutes ago');
    });
  });

  describe('parseDate', () => {
    it('should parse valid date string', () => {
      // Use ISO string to ensure consistent parsing
      const result = parseDate('2023-01-01T00:00:00Z');
      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toBe('2023-01-01T00:00:00.000Z');
    });

    it('should parse valid timestamp', () => {
      const timestamp = new Date('2023-01-01').getTime();
      const result = parseDate(timestamp);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getTime()).toBe(timestamp);
    });

    it('should return same date object if input is Date', () => {
      const date = new Date();
      const result = parseDate(date);
      expect(result).toBe(date);
    });

    it('should return null for invalid date string', () => {
      expect(parseDate('invalid-date')).toBeNull();
    });

    it('should return null for invalid Date object', () => {
      const invalidDate = new Date('invalid');
      expect(parseDate(invalidDate)).toBeNull();
    });
  });

  describe('isValidDate', () => {
    it('should return true for valid Date object', () => {
      expect(isValidDate(new Date())).toBe(true);
    });

    it('should return false for invalid Date object', () => {
      expect(isValidDate(new Date('invalid'))).toBe(false);
    });

    it('should return false for non-Date objects', () => {
      expect(isValidDate('2023-01-01')).toBe(false);
      expect(isValidDate(1234567890)).toBe(false);
      expect(isValidDate(null)).toBe(false);
      expect(isValidDate(undefined)).toBe(false);
    });
  });

  describe('startOfDay', () => {
    it('should return start of day for given date', () => {
      const date = new Date('2023-01-15T15:30:45.123Z');
      const start = startOfDay(date);

      // Check local time components as startOfDay usually resets local time to 00:00:00
      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);
      expect(start.getSeconds()).toBe(0);
      expect(start.getMilliseconds()).toBe(0);

      expect(start.getFullYear()).toBe(2023);
      expect(start.getMonth()).toBe(0); // January is 0
      expect(start.getDate()).toBe(15);
    });

    it('should default to today if no date provided', () => {
      const now = new Date();
      const start = startOfDay();

      expect(start.getFullYear()).toBe(now.getFullYear());
      expect(start.getMonth()).toBe(now.getMonth());
      expect(start.getDate()).toBe(now.getDate());
      expect(start.getHours()).toBe(0);
    });
  });
});
