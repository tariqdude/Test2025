import { describe, it, expect } from 'vitest';
import {
  easeInOut,
  lerp,
  clamp,
  roundTo,
  mapRange,
  inRange,
  randomBetween,
  randomIntBetween,
  percentage,
  fromPercentage,
  gcd,
} from './math';

describe('Math Utilities', () => {
  describe('easeInOut', () => {
    it('should calculate ease in out', () => {
      expect(easeInOut(0)).toBe(0);
      expect(easeInOut(1)).toBe(1);
      expect(easeInOut(0.5)).toBe(0.5);
    });
  });

  describe('lerp', () => {
    it('should interpolate values', () => {
      expect(lerp(0, 10, 0.5)).toBe(5);
      expect(lerp(0, 10, 0)).toBe(0);
      expect(lerp(0, 10, 1)).toBe(10);
    });
  });

  describe('clamp', () => {
    it('should clamp value within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });

  describe('roundTo', () => {
    it('should round to decimal places', () => {
      expect(roundTo(1.2345, 2)).toBe(1.23);
      expect(roundTo(1.2355, 2)).toBe(1.24);
      expect(roundTo(1.2, 2)).toBe(1.2);
    });
  });

  describe('mapRange', () => {
    it('should map value from one range to another', () => {
      expect(mapRange(5, 0, 10, 0, 100)).toBe(50);
      expect(mapRange(0, 0, 10, 0, 100)).toBe(0);
      expect(mapRange(10, 0, 10, 0, 100)).toBe(100);
    });
  });

  describe('inRange', () => {
    it('should check if value is in range', () => {
      expect(inRange(5, 0, 10)).toBe(true);
      expect(inRange(0, 0, 10)).toBe(true);
      expect(inRange(10, 0, 10)).toBe(true);
      expect(inRange(-1, 0, 10)).toBe(false);
      expect(inRange(11, 0, 10)).toBe(false);
    });
  });

  describe('randomBetween', () => {
    it('should generate random number in range', () => {
      const val = randomBetween(0, 10);
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(10); // Math.random() is exclusive of 1
    });
  });

  describe('randomIntBetween', () => {
    it('should generate random integer in range', () => {
      const val = randomIntBetween(0, 10);
      expect(Number.isInteger(val)).toBe(true);
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(10);
    });
  });

  describe('percentage', () => {
    it('should calculate percentage', () => {
      expect(percentage(50, 100)).toBe(50);
      expect(percentage(0, 100)).toBe(0);
    });

    it('should handle zero total', () => {
      expect(percentage(50, 0)).toBe(0);
    });
  });

  describe('fromPercentage', () => {
    it('should calculate value from percentage', () => {
      expect(fromPercentage(50, 100)).toBe(50);
      expect(fromPercentage(25, 200)).toBe(50);
    });
  });

  describe('gcd', () => {
    it('should calculate greatest common divisor', () => {
      expect(gcd(12, 18)).toBe(6);
      expect(gcd(10, 5)).toBe(5);
      expect(gcd(7, 3)).toBe(1);
    });
  });
});
