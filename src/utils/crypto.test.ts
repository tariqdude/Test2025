import { describe, it, expect, vi } from 'vitest';
import {
  uuid,
  shortId,
  nanoId,
  bytesToHex,
  hexToBytes,
  stringToBytes,
  bytesToString,
  bytesToBase64,
  base64ToBytes,
  base64UrlEncode,
  base64UrlDecode,
  hash,
} from './crypto';

describe('Crypto Utilities', () => {
  describe('uuid', () => {
    it('should generate valid UUID', () => {
      const id = uuid();
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it('should use fallback if crypto is undefined', () => {
      const originalCrypto = global.crypto;
      Object.defineProperty(global, 'crypto', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const id = uuid();
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );

      Object.defineProperty(global, 'crypto', {
        value: originalCrypto,
        writable: true,
        configurable: true,
      });
    });
  });

  describe('shortId', () => {
    it('should generate ID of specified length', () => {
      expect(shortId(10)).toHaveLength(10);
    });

    it('should use fallback', () => {
      const originalCrypto = global.crypto;
      Object.defineProperty(global, 'crypto', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      expect(shortId(8)).toHaveLength(8);

      Object.defineProperty(global, 'crypto', {
        value: originalCrypto,
        writable: true,
        configurable: true,
      });
    });
  });

  describe('nanoId', () => {
    it('should generate ID of specified length', () => {
      expect(nanoId(10)).toHaveLength(10);
    });
  });

  describe('Hex Conversion', () => {
    it('should convert bytes to hex', () => {
      const bytes = new Uint8Array([0, 255, 16]);
      expect(bytesToHex(bytes)).toBe('00ff10');
    });

    it('should convert hex to bytes', () => {
      const hex = '00ff10';
      const bytes = hexToBytes(hex);
      expect(Array.from(bytes)).toEqual([0, 255, 16]);
    });

    it('should handle 0x prefix', () => {
      expect(Array.from(hexToBytes('0x00ff'))).toEqual([0, 255]);
    });
  });

  describe('String/Bytes Conversion', () => {
    it('should convert string to bytes and back', () => {
      const str = 'Hello World';
      const bytes = stringToBytes(str);
      expect(bytes.constructor.name).toBe('Uint8Array');
      expect(bytesToString(bytes)).toBe(str);
    });
  });

  describe('Base64 Conversion', () => {
    it('should convert bytes to base64 and back', () => {
      const str = 'Hello World';
      const bytes = stringToBytes(str);
      const b64 = bytesToBase64(bytes);
      expect(b64).toBe('SGVsbG8gV29ybGQ=');
      const decoded = base64ToBytes(b64);
      expect(Array.from(decoded)).toEqual(Array.from(bytes));
    });
  });

  describe('Base64URL Conversion', () => {
    it('should encode and decode URL safe base64', () => {
      const str = 'Hello World?';
      const encoded = base64UrlEncode(str);
      expect(encoded).not.toContain('+');
      expect(encoded).not.toContain('/');
      expect(encoded).not.toContain('=');
      expect(base64UrlDecode(encoded)).toBe(str);
    });
  });

  describe('Hash', () => {
    it('should hash data', async () => {
      const mockDigest = vi
        .fn()
        .mockResolvedValue(new Uint8Array([1, 2, 3]).buffer);

      const originalCrypto = global.crypto;
      Object.defineProperty(global, 'crypto', {
        value: {
          ...originalCrypto,
          subtle: {
            digest: mockDigest,
          },
        },
        writable: true,
        configurable: true,
      });

      const result = await hash('test');
      expect(result).toBe('010203');
      expect(mockDigest).toHaveBeenCalledWith('SHA-256', expect.anything());
      const args = mockDigest.mock.calls[0];
      expect(args[1].byteLength).toBeGreaterThan(0);

      Object.defineProperty(global, 'crypto', {
        value: originalCrypto,
        writable: true,
        configurable: true,
      });
    });
  });
});
