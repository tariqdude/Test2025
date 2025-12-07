/**
 * Diff Utilities Tests
 */
import { describe, it, expect } from 'vitest';
import {
  diffChars,
  diffWords,
  diffLines,
  unifiedDiff,
  diffArrays,
  applyTextPatch,
  generateJSONPatch,
  applyJSONPatch,
  semanticDiff,
  diffStats,
  textsAreEqual,
  getChangedLines,
  highlightInlineChanges,
} from '../utils/diff';

describe('Diff Utilities', () => {
  describe('diffChars', () => {
    it('should find character-level differences', () => {
      const result = diffChars('hello', 'hallo');
      expect(result.changes).toBeGreaterThan(0);
      expect(result.additions).toBe(1);
      expect(result.deletions).toBe(1);
    });

    it('should handle identical strings', () => {
      const result = diffChars('hello', 'hello');
      expect(result.changes).toBe(0);
      expect(result.similarity).toBe(100);
    });

    it('should handle completely different strings', () => {
      const result = diffChars('abc', 'xyz');
      expect(result.additions).toBe(3);
      expect(result.deletions).toBe(3);
    });

    it('should handle empty strings', () => {
      const result = diffChars('', '');
      expect(result.changes).toBe(0);
      expect(result.similarity).toBe(100);
    });

    it('should handle additions only', () => {
      const result = diffChars('abc', 'abcdef');
      expect(result.additions).toBe(3);
      expect(result.deletions).toBe(0);
    });

    it('should handle deletions only', () => {
      const result = diffChars('abcdef', 'abc');
      expect(result.additions).toBe(0);
      expect(result.deletions).toBe(3);
    });
  });

  describe('diffWords', () => {
    it('should find word-level differences', () => {
      const result = diffWords('hello world', 'hello there');
      expect(result.changes).toBeGreaterThan(0);
    });

    it('should handle identical text', () => {
      const result = diffWords('hello world', 'hello world');
      expect(result.changes).toBe(0);
    });

    it('should handle added words', () => {
      const result = diffWords('hello', 'hello world');
      expect(result.additions).toBeGreaterThan(0);
    });

    it('should handle removed words', () => {
      const result = diffWords('hello world', 'hello');
      expect(result.deletions).toBeGreaterThan(0);
    });

    it('should preserve whitespace in operations', () => {
      const result = diffWords('a b c', 'a b c');
      expect(result.similarity).toBe(100);
    });
  });

  describe('diffLines', () => {
    it('should find line-level differences', () => {
      const old = 'line1\nline2\nline3';
      const newText = 'line1\nmodified\nline3';
      const result = diffLines(old, newText);

      expect(result.some(l => l.type === 'removed')).toBe(true);
      expect(result.some(l => l.type === 'added')).toBe(true);
    });

    it('should mark unchanged lines', () => {
      const old = 'line1\nline2\nline3';
      const newText = 'line1\nline2\nline3';
      const result = diffLines(old, newText);

      expect(result.every(l => l.type === 'unchanged')).toBe(true);
    });

    it('should handle added lines', () => {
      const old = 'line1\nline2';
      const newText = 'line1\nline2\nline3';
      const result = diffLines(old, newText);

      expect(result.some(l => l.type === 'added')).toBe(true);
    });

    it('should handle removed lines', () => {
      const old = 'line1\nline2\nline3';
      const newText = 'line1\nline3';
      const result = diffLines(old, newText);

      expect(result.some(l => l.type === 'removed')).toBe(true);
    });

    it('should include line numbers', () => {
      const old = 'line1\nline2';
      const newText = 'line1\nline2';
      const result = diffLines(old, newText);

      expect(result[0].lineNumber).toBe(1);
      expect(result[1].lineNumber).toBe(2);
    });
  });

  describe('unifiedDiff', () => {
    it('should generate unified diff format', () => {
      const old = 'line1\nline2\nline3';
      const newText = 'line1\nmodified\nline3';
      const diff = unifiedDiff(old, newText, 'a.txt', 'b.txt');

      expect(diff).toContain('--- a.txt');
      expect(diff).toContain('+++ b.txt');
      expect(diff).toContain('@@');
    });

    it('should show context lines', () => {
      const old = 'a\nb\nc\nd\ne';
      const newText = 'a\nb\nCHANGED\nd\ne';
      const diff = unifiedDiff(old, newText);

      expect(diff).toContain(' a');
      expect(diff).toContain(' b');
      expect(diff).toContain('-c');
      expect(diff).toContain('+CHANGED');
    });

    it('should handle file names', () => {
      const diff = unifiedDiff('a', 'b', 'old.txt', 'new.txt');

      expect(diff).toContain('--- old.txt');
      expect(diff).toContain('+++ new.txt');
    });
  });

  describe('diffArrays', () => {
    it('should diff arrays of primitives', () => {
      const old = [1, 2, 3, 4, 5];
      const newArr = [1, 2, 4, 5, 6];
      const result = diffArrays(old, newArr);

      expect(result.some(e => e.type === 'removed')).toBe(true);
      expect(result.some(e => e.type === 'added')).toBe(true);
    });

    it('should handle identical arrays', () => {
      const arr = [1, 2, 3];
      const result = diffArrays(arr, arr);

      expect(result.every(e => e.type === 'unchanged')).toBe(true);
    });

    it('should handle arrays with custom comparator', () => {
      const old = [{ id: 1 }, { id: 2 }];
      const newArr = [{ id: 1 }, { id: 3 }];
      const result = diffArrays(old, newArr, (a, b) => a.id === b.id);

      expect(result.length).toBeGreaterThan(0);
    });

    it('should track indices', () => {
      const old = ['a', 'b', 'c'];
      const newArr = ['a', 'b', 'c'];
      const result = diffArrays(old, newArr);

      result.forEach(entry => {
        expect(entry.index).toBeDefined();
      });
    });

    it('should handle empty arrays', () => {
      expect(diffArrays([], []).length).toBe(0);
      expect(diffArrays([1], []).some(e => e.type === 'removed')).toBe(true);
      expect(diffArrays([], [1]).some(e => e.type === 'added')).toBe(true);
    });
  });

  describe('applyTextPatch', () => {
    it('should apply diff to recreate new text', () => {
      const old = 'hello';
      const newText = 'hallo';
      const diff = diffChars(old, newText);

      expect(applyTextPatch(old, diff)).toBe(newText);
    });

    it('should handle additions', () => {
      const old = 'abc';
      const newText = 'abcdef';
      const diff = diffChars(old, newText);

      expect(applyTextPatch(old, diff)).toBe(newText);
    });

    it('should handle deletions', () => {
      const old = 'abcdef';
      const newText = 'abc';
      const diff = diffChars(old, newText);

      expect(applyTextPatch(old, diff)).toBe(newText);
    });
  });

  describe('generateJSONPatch', () => {
    it('should generate patches for object changes', () => {
      const old = { a: 1, b: 2 };
      const newObj = { a: 1, b: 3 };
      const patches = generateJSONPatch(old, newObj);

      expect(patches.length).toBe(1);
      expect(patches[0].op).toBe('replace');
      expect(patches[0].path).toBe('/b');
    });

    it('should detect additions', () => {
      const old = { a: 1 };
      const newObj = { a: 1, b: 2 };
      const patches = generateJSONPatch(old, newObj);

      expect(patches.some(p => p.op === 'add')).toBe(true);
    });

    it('should detect removals', () => {
      const old = { a: 1, b: 2 };
      const newObj = { a: 1 };
      const patches = generateJSONPatch(old, newObj);

      expect(patches.some(p => p.op === 'remove')).toBe(true);
    });

    it('should handle nested objects', () => {
      const old = { user: { name: 'John' } };
      const newObj = { user: { name: 'Jane' } };
      const patches = generateJSONPatch(old, newObj);

      expect(patches.length).toBeGreaterThan(0);
    });

    it('should handle null values', () => {
      const old = { a: null };
      const newObj = { a: 1 };
      const patches = generateJSONPatch(old, newObj);

      expect(patches.length).toBe(1);
    });
  });

  describe('applyJSONPatch', () => {
    it('should apply patches to object', () => {
      const old = { a: 1, b: 2 };
      const patches = [{ op: 'replace' as const, path: '/b', value: 3 }];
      const result = applyJSONPatch(old, patches);

      expect(result.b).toBe(3);
    });

    it('should add new properties', () => {
      const old = { a: 1 };
      const patches = [{ op: 'add' as const, path: '/b', value: 2 }];
      const result = applyJSONPatch(old, patches);

      expect(result.b).toBe(2);
    });

    it('should remove properties', () => {
      const old = { a: 1, b: 2 };
      const patches = [{ op: 'remove' as const, path: '/b' }];
      const result = applyJSONPatch(old, patches);

      expect(result.b).toBeUndefined();
    });

    it('should not mutate original object', () => {
      const old = { a: 1, b: 2 };
      const patches = [{ op: 'replace' as const, path: '/b', value: 3 }];
      applyJSONPatch(old, patches);

      expect(old.b).toBe(2);
    });

    it('should roundtrip with generateJSONPatch', () => {
      const old = { a: 1, b: 2, c: { d: 3 } };
      const newObj = { a: 1, b: 5, c: { d: 4 } };
      const patches = generateJSONPatch(old, newObj);
      const result = applyJSONPatch(old, patches);

      expect(result).toEqual(newObj);
    });
  });

  describe('semanticDiff', () => {
    it('should ignore case when specified', () => {
      const result = semanticDiff('HELLO', 'hello', { ignoreCase: true });
      expect(result.every(l => l.type === 'unchanged')).toBe(true);
    });

    it('should ignore whitespace when specified', () => {
      const result = semanticDiff('hello  world', 'hello world', {
        ignoreWhitespace: true,
      });
      expect(result.every(l => l.type === 'unchanged')).toBe(true);
    });

    it('should ignore empty lines when specified', () => {
      const old = 'line1\n\nline2';
      const newText = 'line1\nline2';
      const result = semanticDiff(old, newText, { ignoreEmptyLines: true });

      expect(result.every(l => l.type === 'unchanged')).toBe(true);
    });

    it('should apply custom normalization', () => {
      const result = semanticDiff('abc', 'ABC', {
        normalize: s => s.toLowerCase(),
      });
      expect(result.every(l => l.type === 'unchanged')).toBe(true);
    });
  });

  describe('diffStats', () => {
    it('should calculate statistics', () => {
      const diff = diffLines('a\nb\nc', 'a\nB\nc');
      const stats = diffStats(diff);

      expect(stats.total).toBe(diff.length);
      expect(typeof stats.added).toBe('number');
      expect(typeof stats.removed).toBe('number');
      expect(typeof stats.unchanged).toBe('number');
      expect(typeof stats.changePercent).toBe('number');
    });

    it('should handle all unchanged', () => {
      const diff = diffLines('a\nb', 'a\nb');
      const stats = diffStats(diff);

      expect(stats.unchanged).toBe(2);
      expect(stats.changePercent).toBe(0);
    });

    it('should calculate change percentage', () => {
      const diff = diffLines('a\nb\nc\nd', 'a\nX\nc\nY');
      const stats = diffStats(diff);

      expect(stats.changePercent).toBeGreaterThan(0);
    });
  });

  describe('textsAreEqual', () => {
    it('should return true for identical texts', () => {
      expect(textsAreEqual('hello', 'hello')).toBe(true);
    });

    it('should return false for different texts', () => {
      expect(textsAreEqual('hello', 'world')).toBe(false);
    });

    it('should respect semantic options', () => {
      expect(textsAreEqual('HELLO', 'hello', { ignoreCase: true })).toBe(true);
      expect(textsAreEqual('HELLO', 'hello', { ignoreCase: false })).toBe(
        false
      );
    });
  });

  describe('getChangedLines', () => {
    it('should filter only changed lines', () => {
      const diff = diffLines('a\nb\nc', 'a\nB\nc');
      const changed = getChangedLines(diff);

      expect(changed.every(l => l.type !== 'unchanged')).toBe(true);
    });

    it('should return empty for identical texts', () => {
      const diff = diffLines('a\nb', 'a\nb');
      const changed = getChangedLines(diff);

      expect(changed.length).toBe(0);
    });
  });

  describe('highlightInlineChanges', () => {
    it('should highlight differences', () => {
      const { oldHighlighted, newHighlighted } = highlightInlineChanges(
        'hello world',
        'hello there'
      );

      expect(oldHighlighted).toContain('<mark>');
      expect(newHighlighted).toContain('<mark>');
    });

    it('should use custom markers', () => {
      const { oldHighlighted } = highlightInlineChanges('abc', 'axc', [
        '[',
        ']',
      ]);

      expect(oldHighlighted).toContain('[');
      expect(oldHighlighted).toContain(']');
    });

    it('should handle identical strings', () => {
      const { oldHighlighted, newHighlighted } = highlightInlineChanges(
        'same',
        'same'
      );

      expect(oldHighlighted).toBe('same');
      expect(newHighlighted).toBe('same');
    });
  });
});
