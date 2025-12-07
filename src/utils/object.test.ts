import { describe, it, expect } from 'vitest';
import { deepMerge, pick, omit, deepClone } from './object';

describe('Object Utilities', () => {
  describe('deepMerge', () => {
    it('should merge objects deeply', () => {
      const target: any = { a: 1, b: { c: 2 } };
      const source: any = { b: { d: 3 }, e: 4 };
      const result = deepMerge(target, source);
      expect(result).toEqual({ a: 1, b: { c: 2, d: 3 }, e: 4 });
    });

    it('should overwrite primitive values', () => {
      const target = { a: 1 };
      const source = { a: 2 };
      expect(deepMerge(target, source)).toEqual({ a: 2 });
    });

    it('should handle multiple sources', () => {
      const target: any = { a: 1 };
      const source1: any = { b: 2 };
      const source2: any = { c: 3 };
      expect(deepMerge(target, source1, source2)).toEqual({ a: 1, b: 2, c: 3 });
    });
  });

  describe('pick', () => {
    it('should pick specified keys', () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(pick(obj, ['a', 'c'])).toEqual({ a: 1, c: 3 });
    });

    it('should ignore missing keys', () => {
      const obj = { a: 1 };
      // @ts-expect-error - testing runtime behavior
      expect(pick(obj, ['a', 'b'])).toEqual({ a: 1 });
    });
  });

  describe('omit', () => {
    it('should omit specified keys', () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(omit(obj, ['b'])).toEqual({ a: 1, c: 3 });
    });

    it('should handle missing keys gracefully', () => {
      const obj = { a: 1 };
      // @ts-expect-error - testing runtime behavior
      expect(omit(obj, ['b'])).toEqual({ a: 1 });
    });
  });

  describe('deepClone', () => {
    it('should clone primitives', () => {
      expect(deepClone(1)).toBe(1);
      expect(deepClone('string')).toBe('string');
      expect(deepClone(null)).toBe(null);
    });

    it('should clone objects deeply', () => {
      const obj = { a: 1, b: { c: 2 } };
      const clone = deepClone(obj);
      expect(clone).toEqual(obj);
      expect(clone).not.toBe(obj);
      expect(clone.b).not.toBe(obj.b);
    });

    it('should clone arrays', () => {
      const arr = [1, { a: 2 }];
      const clone = deepClone(arr);
      expect(clone).toEqual(arr);
      expect(clone).not.toBe(arr);
      expect(clone[1]).not.toBe(arr[1]);
    });

    it('should clone Date objects', () => {
      const date = new Date();
      const clone = deepClone(date);
      expect(clone).toEqual(date);
      expect(clone).not.toBe(date);
    });

    it('should clone RegExp', () => {
      const regex = /test/gi;
      const clone = deepClone(regex);
      expect(clone).toEqual(regex);
      expect(clone).not.toBe(regex);
    });

    it('should clone Map', () => {
      const map = new Map([['a', 1]]);
      const clone = deepClone(map);
      expect(clone).toEqual(map);
      expect(clone).not.toBe(map);
    });

    it('should clone Set', () => {
      const set = new Set([1, 2]);
      const clone = deepClone(set);
      expect(clone).toEqual(set);
      expect(clone).not.toBe(set);
    });
  });
});
