import { describe, it, expect } from 'vitest';
import {
  groupBy,
  sortBy,
  unique,
  chunk,
  shuffle,
  flatten,
  intersection,
  difference,
  union,
} from './array';

describe('Array Utilities', () => {
  describe('groupBy', () => {
    it('should group by property', () => {
      const data = [
        { id: 1, category: 'A' },
        { id: 2, category: 'B' },
        { id: 3, category: 'A' },
      ];
      const result = groupBy(data, 'category');
      expect(result).toEqual({
        A: [
          { id: 1, category: 'A' },
          { id: 3, category: 'A' },
        ],
        B: [{ id: 2, category: 'B' }],
      });
    });

    it('should group by function', () => {
      const data = [1.1, 2.2, 2.3, 3.4];
      const result = groupBy(data, Math.floor);
      expect(result).toEqual({
        1: [1.1],
        2: [2.2, 2.3],
        3: [3.4],
      });
    });
  });

  describe('sortBy', () => {
    it('should sort ascending by default', () => {
      const data = [{ val: 3 }, { val: 1 }, { val: 2 }];
      const result = sortBy(data, 'val');
      expect(result).toEqual([{ val: 1 }, { val: 2 }, { val: 3 }]);
    });

    it('should sort descending', () => {
      const data = [{ val: 1 }, { val: 3 }, { val: 2 }];
      const result = sortBy(data, 'val', 'desc');
      expect(result).toEqual([{ val: 3 }, { val: 2 }, { val: 1 }]);
    });

    it('should not mutate original array', () => {
      const data = [{ val: 2 }, { val: 1 }];
      const original = [...data];
      sortBy(data, 'val');
      expect(data).toEqual(original);
    });
  });

  describe('unique', () => {
    it('should remove duplicates', () => {
      expect(unique([1, 2, 2, 3, 1])).toEqual([1, 2, 3]);
    });

    it('should handle empty array', () => {
      expect(unique([])).toEqual([]);
    });
  });

  describe('chunk', () => {
    it('should chunk array', () => {
      expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    });

    it('should throw on invalid size', () => {
      expect(() => chunk([1], 0)).toThrow();
    });
  });

  describe('shuffle', () => {
    it('should shuffle array', () => {
      const data = [1, 2, 3, 4, 5];
      const result = shuffle(data);
      expect(result).toHaveLength(data.length);
      expect(result.sort()).toEqual(data.sort());
    });

    it('should not mutate original array', () => {
      const data = [1, 2, 3];
      const original = [...data];
      shuffle(data);
      expect(data).toEqual(original);
    });
  });

  describe('flatten', () => {
    it('should flatten array', () => {
      expect(flatten([1, [2, 3], [4, [5]]])).toEqual([1, 2, 3, 4, [5]]);
    });

    it('should flatten to depth', () => {
      expect(flatten([1, [2, [3]]], 2)).toEqual([1, 2, 3]);
    });
  });

  describe('intersection', () => {
    it('should return common items', () => {
      expect(intersection([1, 2, 3], [2, 3, 4])).toEqual([2, 3]);
    });

    it('should handle no intersection', () => {
      expect(intersection([1, 2], [3, 4])).toEqual([]);
    });
  });

  describe('difference', () => {
    it('should return items in first array not in second', () => {
      expect(difference([1, 2, 3], [2, 3, 4])).toEqual([1]);
    });
  });

  describe('union', () => {
    it('should return unique items from both arrays', () => {
      expect(union([1, 2], [2, 3])).toEqual([1, 2, 3]);
    });
  });
});
