/**
 * Compression Utilities Tests
 */
import { describe, it, expect } from 'vitest';
import {
  isCompressionSupported,
  compressionRatio,
  compressionSavings,
  rleEncode,
  rleDecode,
  lzCompress,
  lzDecompress,
  deltaEncode,
  deltaDecode,
  packBytes,
  unpackBytes,
  packBooleans,
  unpackBooleans,
  compressJSON,
  decompressJSON,
  deduplicateStrings,
  restoreStrings,
  buildHuffmanTable,
  huffmanEncode,
  huffmanDecode,
  estimateHuffmanRatio,
} from '../utils/compression';

describe('Compression Utilities', () => {
  describe('isCompressionSupported', () => {
    it('should return a boolean', () => {
      const result = isCompressionSupported();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('compressionRatio', () => {
    it('should calculate correct ratio', () => {
      // compressionRatio returns ratio as decimal (compressed/original)
      expect(compressionRatio(100, 50)).toBe(0.5);
      expect(compressionRatio(100, 25)).toBe(0.25);
      expect(compressionRatio(100, 100)).toBe(1);
    });

    it('should handle edge cases', () => {
      expect(compressionRatio(0, 0)).toBe(0);
      expect(compressionRatio(100, 0)).toBe(0);
    });
  });

  describe('compressionSavings', () => {
    it('should calculate savings percentage', () => {
      // compressionSavings returns percentage saved (0-100)
      expect(compressionSavings(100, 50)).toBe(50);
      expect(compressionSavings(1000, 250)).toBe(75);
    });
  });

  describe('RLE Encoding', () => {
    it('should encode repeated characters', () => {
      expect(rleEncode('AAABBBCC')).toBe('3A3B2C');
      expect(rleEncode('WWWWWWWWWWBBB')).toBe('10W3B');
    });

    it('should handle single characters', () => {
      expect(rleEncode('ABC')).toBe('1A1B1C');
    });

    it('should handle empty string', () => {
      expect(rleEncode('')).toBe('');
    });

    it('should decode correctly', () => {
      expect(rleDecode('3A3B2C')).toBe('AAABBBCC');
      expect(rleDecode('10W3B')).toBe('WWWWWWWWWWBBB');
    });

    it('should roundtrip correctly', () => {
      const original = 'AAAAABBBBCCCCDDDD';
      expect(rleDecode(rleEncode(original))).toBe(original);
    });

    it('should handle long runs', () => {
      const longRun = 'A'.repeat(150);
      const encoded = rleEncode(longRun);
      expect(rleDecode(encoded)).toBe(longRun);
    });
  });

  describe('LZ Compression', () => {
    it('should compress text with repeated patterns', () => {
      const input = 'ABABABABAB';
      const compressed = lzCompress(input);
      expect(typeof compressed).toBe('string');
      expect(compressed.length).toBeLessThanOrEqual(input.length);
    });

    it('should decompress correctly', () => {
      const original = 'ABABABABABAB';
      const compressed = lzCompress(original);
      expect(lzDecompress(compressed)).toBe(original);
    });

    it('should handle empty string', () => {
      expect(lzCompress('')).toBe('');
      expect(lzDecompress('')).toBe('');
    });

    it('should handle unique characters', () => {
      const original = 'ABCDEFG';
      const compressed = lzCompress(original);
      expect(lzDecompress(compressed)).toBe(original);
    });

    it('should handle repeated strings', () => {
      const original = 'hellohellohello';
      const compressed = lzCompress(original);
      expect(lzDecompress(compressed)).toBe(original);
    });
  });

  describe('Delta Encoding', () => {
    it('should encode sequential numbers', () => {
      expect(deltaEncode([1, 2, 3, 4, 5])).toEqual([1, 1, 1, 1, 1]);
      expect(deltaEncode([10, 20, 30, 40])).toEqual([10, 10, 10, 10]);
    });

    it('should decode correctly', () => {
      expect(deltaDecode([1, 1, 1, 1, 1])).toEqual([1, 2, 3, 4, 5]);
      expect(deltaDecode([10, 10, 10, 10])).toEqual([10, 20, 30, 40]);
    });

    it('should handle negative deltas', () => {
      const original = [10, 8, 6, 4, 2];
      expect(deltaDecode(deltaEncode(original))).toEqual(original);
    });

    it('should handle empty array', () => {
      expect(deltaEncode([])).toEqual([]);
      expect(deltaDecode([])).toEqual([]);
    });

    it('should handle single element', () => {
      expect(deltaEncode([42])).toEqual([42]);
      expect(deltaDecode([42])).toEqual([42]);
    });

    it('should roundtrip correctly', () => {
      const original = [100, 150, 125, 175, 200];
      expect(deltaDecode(deltaEncode(original))).toEqual(original);
    });
  });

  describe('Byte Packing', () => {
    it('should pack bytes', () => {
      const bytes = [65, 66, 67]; // ABC
      const packed = packBytes(bytes);
      expect(packed).toBe('ABC');
    });

    it('should unpack bytes', () => {
      const packed = 'ABC';
      expect(unpackBytes(packed)).toEqual([65, 66, 67]);
    });

    it('should handle empty array', () => {
      expect(packBytes([])).toBe('');
      expect(unpackBytes('')).toEqual([]);
    });

    it('should roundtrip various bytes', () => {
      const bytes = [0, 128, 255, 100, 200];
      const packed = packBytes(bytes);
      expect(unpackBytes(packed)).toEqual(bytes);
    });
  });

  describe('Boolean Packing', () => {
    it('should pack booleans to string', () => {
      const bools = [true, false, true, true, false, false, true, false];
      const packed = packBooleans(bools);
      expect(typeof packed).toBe('string');
    });

    it('should unpack booleans', () => {
      const bools = [true, false, true, true, false, false, true, false];
      const packed = packBooleans(bools);
      expect(unpackBooleans(packed)).toEqual(bools);
    });

    it('should handle all true', () => {
      const bools = [true, true, true, true];
      const packed = packBooleans(bools);
      expect(unpackBooleans(packed)).toEqual(bools);
    });

    it('should handle all false', () => {
      const bools = [false, false, false, false];
      const packed = packBooleans(bools);
      expect(unpackBooleans(packed)).toEqual(bools);
    });

    it('should handle empty array', () => {
      const packed = packBooleans([]);
      expect(unpackBooleans(packed)).toEqual([]);
    });

    it('should handle up to 32 booleans', () => {
      const bools = Array.from({ length: 32 }, (_, i) => i % 2 === 0);
      const packed = packBooleans(bools);
      expect(unpackBooleans(packed)).toEqual(bools);
    });
  });

  describe('JSON Compression', () => {
    it('should compress JSON object with minify', () => {
      const obj = {
        firstName: 'John',
        lastName: 'Doe',
        emailAddress: 'john@example.com',
      };
      const compressed = compressJSON(obj);
      expect(compressed.json).toBeDefined();
      // Should be minified by default
      expect(compressed.json).not.toContain('\n');
    });

    it('should compress with shortened keys', () => {
      const obj = {
        firstName: 'John',
        lastName: 'Doe',
        emailAddress: 'john@example.com',
      };
      const compressed = compressJSON(obj, { shortenKeys: true });
      expect(compressed.json).toBeDefined();
      expect(compressed.keyMap).toBeDefined();
    });

    it('should decompress JSON object with keyMap', () => {
      const obj = {
        firstName: 'John',
        lastName: 'Doe',
      };
      const compressed = compressJSON(obj, { shortenKeys: true });
      const decompressed = decompressJSON(compressed.json, compressed.keyMap!);
      expect(decompressed).toEqual(obj);
    });

    it('should handle nested objects', () => {
      const obj = {
        user: {
          firstName: 'John',
          lastName: 'Doe',
        },
        address: {
          streetAddress: '123 Main St',
          cityName: 'New York',
        },
      };
      const compressed = compressJSON(obj, { shortenKeys: true });
      const decompressed = decompressJSON(compressed.json, compressed.keyMap!);
      expect(decompressed).toEqual(obj);
    });

    it('should handle arrays', () => {
      const obj = {
        users: [{ firstName: 'John' }, { firstName: 'Jane' }],
      };
      const compressed = compressJSON(obj, { shortenKeys: true });
      const decompressed = decompressJSON(compressed.json, compressed.keyMap!);
      expect(decompressed).toEqual(obj);
    });

    it('should handle primitive values', () => {
      const obj = {
        count: 42,
        active: true,
        name: null,
      };
      const compressed = compressJSON(obj, { shortenKeys: true });
      const decompressed = decompressJSON(compressed.json, compressed.keyMap!);
      expect(decompressed).toEqual(obj);
    });
  });

  describe('String Deduplication', () => {
    it('should deduplicate repeated strings', () => {
      const strings = ['hello', 'world', 'hello', 'world', 'hello'];
      const result = deduplicateStrings(strings);
      expect(result.dictionary.length).toBe(2);
      expect(result.indices).toEqual([0, 1, 0, 1, 0]);
    });

    it('should restore original strings', () => {
      const strings = ['hello', 'world', 'hello', 'world', 'hello'];
      const result = deduplicateStrings(strings);
      expect(restoreStrings(result.indices, result.dictionary)).toEqual(
        strings
      );
    });

    it('should handle all unique strings', () => {
      const strings = ['a', 'b', 'c', 'd', 'e'];
      const result = deduplicateStrings(strings);
      expect(result.dictionary.length).toBe(5);
      expect(restoreStrings(result.indices, result.dictionary)).toEqual(
        strings
      );
    });

    it('should handle empty array', () => {
      const result = deduplicateStrings([]);
      expect(result.dictionary).toEqual([]);
      expect(result.indices).toEqual([]);
      expect(restoreStrings(result.indices, result.dictionary)).toEqual([]);
    });

    it('should handle all identical strings', () => {
      const strings = ['same', 'same', 'same', 'same'];
      const result = deduplicateStrings(strings);
      expect(result.dictionary.length).toBe(1);
      expect(restoreStrings(result.indices, result.dictionary)).toEqual(
        strings
      );
    });
  });

  describe('Huffman Coding', () => {
    it('should build Huffman table as Map', () => {
      const table = buildHuffmanTable('AAAAABBBCCDE');
      expect(table).toBeInstanceOf(Map);
      expect(table.has('A')).toBe(true);
      expect(table.has('B')).toBe(true);
      expect(table.has('C')).toBe(true);
      expect(table.has('D')).toBe(true);
      expect(table.has('E')).toBe(true);
    });

    it('should encode and decode correctly', () => {
      const original = 'AAAAABBBCCDE';
      const table = buildHuffmanTable(original);
      const encoded = huffmanEncode(original, table);
      expect(huffmanDecode(encoded, table)).toBe(original);
    });

    it('should handle repeated characters', () => {
      const original = 'AAAAAAAAAA';
      const table = buildHuffmanTable(original);
      const encoded = huffmanEncode(original, table);
      expect(huffmanDecode(encoded, table)).toBe(original);
    });

    it('should estimate compression ratio', () => {
      const text = 'AAAAABBBCCDE';
      const ratio = estimateHuffmanRatio(text);
      expect(typeof ratio).toBe('number');
      expect(ratio).toBeGreaterThan(0);
    });

    it('should give lower ratio for highly compressible text', () => {
      const compressible = 'A'.repeat(100);
      const random = 'ABCDEFGHIJ'.repeat(10);

      const compressibleRatio = estimateHuffmanRatio(compressible);
      const randomRatio = estimateHuffmanRatio(random);

      expect(compressibleRatio).toBeLessThan(randomRatio);
    });

    it('should handle single character', () => {
      const original = 'AAAAA';
      const table = buildHuffmanTable(original);
      const encoded = huffmanEncode(original, table);
      expect(huffmanDecode(encoded, table)).toBe(original);
    });

    it('should handle two characters', () => {
      const original = 'ABABAB';
      const table = buildHuffmanTable(original);
      const encoded = huffmanEncode(original, table);
      expect(huffmanDecode(encoded, table)).toBe(original);
    });
  });
});
