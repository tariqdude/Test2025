/**
 * Binary Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import {
  toUint8Array,
  toString,
  toHex,
  fromHex,
  toBase64,
  fromBase64,
  toBase64Url,
  fromBase64Url,
  concat,
  compare,
  equals,
  slice,
  fill,
  zeros,
  random,
  copy,
  indexOf,
  split,
  BinaryReader,
  BinaryWriter,
  BitSet,
  getBit,
  setBit,
  clearBit,
  toggleBit,
  popCount,
  highestBit,
  lowestBit,
  isPowerOf2,
  nextPowerOf2,
  reverseBits,
  rotateLeft,
  rotateRight,
  crc32,
  adler32,
  xorChecksum,
  sumChecksum,
} from './binary';

describe('Binary Utilities', () => {
  describe('Conversion Utilities', () => {
    describe('toUint8Array', () => {
      it('should pass through Uint8Array', () => {
        const input = new Uint8Array([1, 2, 3]);
        expect(toUint8Array(input)).toBe(input);
      });

      it('should convert ArrayBuffer', () => {
        const buffer = new ArrayBuffer(3);
        const view = new Uint8Array(buffer);
        view[0] = 1;
        view[1] = 2;
        view[2] = 3;
        const result = toUint8Array(buffer);
        expect(Array.from(result)).toEqual([1, 2, 3]);
      });

      it('should convert array of numbers', () => {
        const result = toUint8Array([1, 2, 3]);
        expect(Array.from(result)).toEqual([1, 2, 3]);
      });

      it('should convert string to UTF-8', () => {
        const result = toUint8Array('hello');
        expect(toString(result)).toBe('hello');
      });
    });

    describe('toHex/fromHex', () => {
      it('should convert to hex string', () => {
        const bytes = new Uint8Array([0, 255, 16, 128]);
        expect(toHex(bytes)).toBe('00ff1080');
      });

      it('should convert from hex string', () => {
        const result = fromHex('00ff1080');
        expect(Array.from(result)).toEqual([0, 255, 16, 128]);
      });

      it('should handle hex with spaces', () => {
        const result = fromHex('00 ff 10 80');
        expect(Array.from(result)).toEqual([0, 255, 16, 128]);
      });

      it('should throw on invalid hex', () => {
        expect(() => fromHex('gg')).toThrow();
        expect(() => fromHex('abc')).toThrow(); // odd length
      });
    });

    describe('toBase64/fromBase64', () => {
      it('should convert to base64', () => {
        const bytes = toUint8Array('hello');
        const base64 = toBase64(bytes);
        expect(base64).toBe('aGVsbG8=');
      });

      it('should convert from base64', () => {
        const result = fromBase64('aGVsbG8=');
        expect(toString(result)).toBe('hello');
      });
    });

    describe('toBase64Url/fromBase64Url', () => {
      it('should create URL-safe base64', () => {
        const bytes = new Uint8Array([251, 239]); // produces + and / in standard base64
        const url = toBase64Url(bytes);
        expect(url).not.toContain('+');
        expect(url).not.toContain('/');
        expect(url).not.toContain('=');
      });

      it('should round-trip correctly', () => {
        const original = new Uint8Array([1, 2, 3, 4, 5]);
        const encoded = toBase64Url(original);
        const decoded = fromBase64Url(encoded);
        expect(Array.from(decoded)).toEqual(Array.from(original));
      });
    });
  });

  describe('Buffer Operations', () => {
    describe('concat', () => {
      it('should concatenate buffers', () => {
        const a = new Uint8Array([1, 2]);
        const b = new Uint8Array([3, 4]);
        const c = new Uint8Array([5]);
        const result = concat(a, b, c);
        expect(Array.from(result)).toEqual([1, 2, 3, 4, 5]);
      });
    });

    describe('compare', () => {
      it('should return 0 for equal buffers', () => {
        const a = new Uint8Array([1, 2, 3]);
        const b = new Uint8Array([1, 2, 3]);
        expect(compare(a, b)).toBe(0);
      });

      it('should return negative for a < b', () => {
        const a = new Uint8Array([1, 2]);
        const b = new Uint8Array([1, 3]);
        expect(compare(a, b)).toBeLessThan(0);
      });

      it('should return positive for a > b', () => {
        const a = new Uint8Array([1, 3]);
        const b = new Uint8Array([1, 2]);
        expect(compare(a, b)).toBeGreaterThan(0);
      });
    });

    describe('equals', () => {
      it('should return true for equal buffers', () => {
        const a = new Uint8Array([1, 2, 3]);
        const b = new Uint8Array([1, 2, 3]);
        expect(equals(a, b)).toBe(true);
      });

      it('should return false for different buffers', () => {
        const a = new Uint8Array([1, 2, 3]);
        const b = new Uint8Array([1, 2, 4]);
        expect(equals(a, b)).toBe(false);
      });
    });

    describe('slice', () => {
      it('should slice buffer', () => {
        const buffer = new Uint8Array([1, 2, 3, 4, 5]);
        expect(Array.from(slice(buffer, 1, 4))).toEqual([2, 3, 4]);
      });
    });

    describe('fill', () => {
      it('should fill buffer', () => {
        const buffer = new Uint8Array(5);
        fill(buffer, 42);
        expect(Array.from(buffer)).toEqual([42, 42, 42, 42, 42]);
      });
    });

    describe('zeros', () => {
      it('should create zero-filled buffer', () => {
        const result = zeros(5);
        expect(Array.from(result)).toEqual([0, 0, 0, 0, 0]);
      });
    });

    describe('random', () => {
      it('should create random buffer', () => {
        const a = random(10);
        const b = random(10);
        expect(a.length).toBe(10);
        // Very unlikely to be equal
        expect(equals(a, b)).toBe(false);
      });
    });

    describe('copy', () => {
      it('should create a copy', () => {
        const original = new Uint8Array([1, 2, 3]);
        const copied = copy(original);
        expect(Array.from(copied)).toEqual([1, 2, 3]);
        expect(copied).not.toBe(original);
      });
    });

    describe('indexOf', () => {
      it('should find pattern', () => {
        const buffer = new Uint8Array([1, 2, 3, 4, 5]);
        expect(indexOf(buffer, [3, 4])).toBe(2);
      });

      it('should return -1 if not found', () => {
        const buffer = new Uint8Array([1, 2, 3]);
        expect(indexOf(buffer, [4, 5])).toBe(-1);
      });
    });

    describe('split', () => {
      it('should split by delimiter', () => {
        const buffer = toUint8Array('a,b,c');
        const parts = split(buffer, toUint8Array(','));
        expect(parts.map(p => toString(p))).toEqual(['a', 'b', 'c']);
      });
    });
  });

  describe('BinaryReader', () => {
    it('should read integers', () => {
      const buffer = new Uint8Array([0x12, 0x34, 0x56, 0x78]);
      const reader = new BinaryReader(buffer, 'little');

      expect(reader.readUint16()).toBe(0x3412);
      expect(reader.readUint16()).toBe(0x7856);
    });

    it('should read strings', () => {
      const text = 'hello\0';
      const buffer = toUint8Array(text);
      const reader = new BinaryReader(buffer);

      expect(reader.readCString()).toBe('hello');
    });

    it('should track position', () => {
      const buffer = new Uint8Array(10);
      const reader = new BinaryReader(buffer);

      expect(reader.position).toBe(0);
      reader.readUint8();
      expect(reader.position).toBe(1);
      reader.skip(3);
      expect(reader.position).toBe(4);
      reader.seek(0);
      expect(reader.position).toBe(0);
    });
  });

  describe('BinaryWriter', () => {
    it('should write integers', () => {
      const writer = new BinaryWriter(256, 'little');
      writer.writeUint16(0x1234);
      writer.writeUint32(0x12345678);

      const buffer = writer.toBuffer();
      expect(buffer[0]).toBe(0x34);
      expect(buffer[1]).toBe(0x12);
    });

    it('should write strings', () => {
      const writer = new BinaryWriter();
      writer.writeCString('hello');

      const buffer = writer.toBuffer();
      expect(toString(slice(buffer, 0, 5))).toBe('hello');
      expect(buffer[5]).toBe(0);
    });
  });

  describe('BitSet', () => {
    it('should get and set bits', () => {
      const bits = new BitSet(100);
      expect(bits.get(50)).toBe(false);
      bits.set(50);
      expect(bits.get(50)).toBe(true);
      bits.clear(50);
      expect(bits.get(50)).toBe(false);
    });

    it('should toggle bits', () => {
      const bits = new BitSet(10);
      bits.toggle(5);
      expect(bits.get(5)).toBe(true);
      bits.toggle(5);
      expect(bits.get(5)).toBe(false);
    });

    it('should count set bits', () => {
      const bits = new BitSet(100);
      bits.set(10);
      bits.set(20);
      bits.set(30);
      expect(bits.count()).toBe(3);
    });

    it('should perform bitwise operations', () => {
      const a = new BitSet(8);
      const b = new BitSet(8);
      a.set(0);
      a.set(1);
      b.set(1);
      b.set(2);

      const andResult = a.and(b);
      expect(andResult.get(0)).toBe(false);
      expect(andResult.get(1)).toBe(true);
      expect(andResult.get(2)).toBe(false);

      const orResult = a.or(b);
      expect(orResult.get(0)).toBe(true);
      expect(orResult.get(1)).toBe(true);
      expect(orResult.get(2)).toBe(true);
    });
  });

  describe('Bit Manipulation', () => {
    it('should get/set/clear/toggle bits', () => {
      let n = 0b1010;
      expect(getBit(n, 1)).toBe(true);
      expect(getBit(n, 0)).toBe(false);

      n = setBit(n, 0);
      expect(getBit(n, 0)).toBe(true);

      n = clearBit(n, 1);
      expect(getBit(n, 1)).toBe(false);

      n = toggleBit(n, 2);
      expect(getBit(n, 2)).toBe(true);
    });

    it('should count population', () => {
      expect(popCount(0b1010101)).toBe(4);
      expect(popCount(0b11111111)).toBe(8);
      expect(popCount(0)).toBe(0);
    });

    it('should find highest/lowest bits', () => {
      expect(highestBit(0b1000)).toBe(3);
      expect(highestBit(0b1010)).toBe(3);
      expect(highestBit(0)).toBe(-1);

      expect(lowestBit(0b1000)).toBe(3);
      expect(lowestBit(0b1010)).toBe(1);
      expect(lowestBit(0)).toBe(-1);
    });

    it('should check power of 2', () => {
      expect(isPowerOf2(1)).toBe(true);
      expect(isPowerOf2(2)).toBe(true);
      expect(isPowerOf2(4)).toBe(true);
      expect(isPowerOf2(3)).toBe(false);
      expect(isPowerOf2(0)).toBe(false);
    });

    it('should find next power of 2', () => {
      expect(nextPowerOf2(3)).toBe(4);
      expect(nextPowerOf2(5)).toBe(8);
      expect(nextPowerOf2(8)).toBe(8);
    });

    it('should reverse bits', () => {
      expect(reverseBits(0b10000000000000000000000000000000)).toBe(1);
    });

    it('should rotate bits', () => {
      const n = 0b10000001;
      expect(rotateLeft(n, 1, 8) & 0xff).toBe(0b00000011);
      expect(rotateRight(n, 1, 8) & 0xff).toBe(0b11000000);
    });
  });

  describe('Checksum Utilities', () => {
    it('should calculate CRC32', () => {
      const data = toUint8Array('hello');
      const checksum = crc32(data);
      expect(typeof checksum).toBe('number');
      expect(checksum).toBe(907060870); // Known CRC32 value
    });

    it('should calculate Adler32', () => {
      const data = toUint8Array('hello');
      const checksum = adler32(data);
      expect(typeof checksum).toBe('number');
    });

    it('should calculate XOR checksum', () => {
      const data = new Uint8Array([1, 2, 3]);
      expect(xorChecksum(data)).toBe(0);
    });

    it('should calculate sum checksum', () => {
      const data = new Uint8Array([100, 100, 100]);
      expect(sumChecksum(data)).toBe(300 & 0xff);
    });
  });
});
