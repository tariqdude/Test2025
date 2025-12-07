import { describe, it, expect } from 'vitest';
import { uuid, shortId, nanoId, bytesToHex, hexToBytes } from './crypto';

describe('Crypto Utilities', () => {
  describe('uuid', () => {
    it('should generate valid UUID', () => {
      const id = uuid();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should use fallback if crypto is undefined', () => {
      const originalCrypto = global.crypto;
      // @ts-expect-error - Testing fallback
      global.crypto = undefined;
      
      const id = uuid();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      
      global.crypto = originalCrypto;
    });
  });

  describe('shortId', () => {
    it('should generate ID of specified length', () => {
      expect(shortId(10)).toHaveLength(10);
    });
    
    it('should use fallback', () => {
      const originalCrypto = global.crypto;
      // @ts-expect-error - Testing fallback
      global.crypto = undefined;
      
      expect(shortId(8)).toHaveLength(8);
      
      global.crypto = originalCrypto;
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
      expect(bytes).toEqual(new Uint8Array([0, 255, 16]));
    });
    
    it('should handle 0x prefix', () => {
        expect(hexToBytes('0x00ff')).toEqual(new Uint8Array([0, 255]));
    });
  });
});
