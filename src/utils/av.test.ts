/**
 * Audio/Video Media Utilities Tests
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatMediaDuration,
  parseMediaDuration,
  isMediaRecorderSupported,
  isMimeTypeSupported,
  getSupportedMimeTypes,
  isWebAudioSupported,
} from './av';

describe('Audio/Video Media Utilities', () => {
  describe('formatMediaDuration', () => {
    it('should format seconds only', () => {
      expect(formatMediaDuration(45)).toBe('00:45');
    });

    it('should format minutes and seconds', () => {
      expect(formatMediaDuration(125)).toBe('02:05');
    });

    it('should format hours', () => {
      expect(formatMediaDuration(3661)).toBe('01:01:01');
    });

    it('should handle zero', () => {
      expect(formatMediaDuration(0)).toBe('00:00');
    });

    it('should handle decimal seconds', () => {
      expect(formatMediaDuration(90.5)).toBe('01:30');
    });

    it('should pad seconds correctly', () => {
      expect(formatMediaDuration(65)).toBe('01:05');
      expect(formatMediaDuration(60)).toBe('01:00');
    });

    it('should show hours when specified', () => {
      const result = formatMediaDuration(65, true);
      expect(result).toBe('00:01:05');
    });

    it('should handle single digit minute boundary', () => {
      expect(formatMediaDuration(59)).toBe('00:59');
    });

    it('should handle exact minute', () => {
      expect(formatMediaDuration(120)).toBe('02:00');
    });

    it('should handle exact hour', () => {
      expect(formatMediaDuration(3600)).toBe('01:00:00');
    });

    it('should handle very large values', () => {
      const result = formatMediaDuration(360000); // 100 hours
      expect(result).toContain(':');
    });

    it('should handle negative values gracefully', () => {
      // Math.floor of negative gives negative, but should still format
      const result = formatMediaDuration(-10);
      expect(typeof result).toBe('string');
    });
  });

  describe('parseMediaDuration', () => {
    it('should parse minutes:seconds', () => {
      expect(parseMediaDuration('02:05')).toBe(125);
    });

    it('should parse hours:minutes:seconds', () => {
      expect(parseMediaDuration('01:01:01')).toBe(3661);
    });

    it('should handle zero', () => {
      expect(parseMediaDuration('00:00')).toBe(0);
    });

    it('should be inverse of formatMediaDuration', () => {
      const original = 3661;
      const formatted = formatMediaDuration(original);
      const parsed = parseMediaDuration(formatted);
      expect(parsed).toBe(original);
    });

    it('should handle single digit parsing', () => {
      expect(parseMediaDuration('1:30')).toBe(90);
    });

    it('should handle single value', () => {
      expect(parseMediaDuration('45')).toBe(45);
    });

    it('should handle empty string', () => {
      expect(parseMediaDuration('')).toBe(0);
    });
  });

  describe('isMediaRecorderSupported', () => {
    it('should return boolean', () => {
      const result = isMediaRecorderSupported();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('isMimeTypeSupported', () => {
    it('should return boolean', () => {
      const result = isMimeTypeSupported('audio/webm');
      expect(typeof result).toBe('boolean');
    });

    it('should return false for invalid mime type', () => {
      const result = isMimeTypeSupported('invalid/type');
      expect(result).toBe(false);
    });

    it('should return false when MediaRecorder is not available', () => {
      const originalMediaRecorder = globalThis.MediaRecorder;
      // @ts-expect-error - Testing undefined case
      globalThis.MediaRecorder = undefined;
      const result = isMimeTypeSupported('audio/webm');
      expect(result).toBe(false);
      globalThis.MediaRecorder = originalMediaRecorder;
    });
  });

  describe('getSupportedMimeTypes', () => {
    it('should return object with audio and video arrays', () => {
      const types = getSupportedMimeTypes();
      expect(Array.isArray(types.audio)).toBe(true);
      expect(Array.isArray(types.video)).toBe(true);
    });

    it('should return empty arrays when MediaRecorder not available', () => {
      const originalMediaRecorder = globalThis.MediaRecorder;
      // @ts-expect-error - Testing undefined case
      globalThis.MediaRecorder = undefined;
      const types = getSupportedMimeTypes();
      expect(types.audio).toEqual([]);
      expect(types.video).toEqual([]);
      globalThis.MediaRecorder = originalMediaRecorder;
    });
  });

  describe('isWebAudioSupported', () => {
    it('should return boolean', () => {
      const result = isWebAudioSupported();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Duration round-trip tests', () => {
    const testCases = [
      { seconds: 0, formatted: '00:00' },
      { seconds: 59, formatted: '00:59' },
      { seconds: 60, formatted: '01:00' },
      { seconds: 3599, formatted: '59:59' },
      { seconds: 3600, formatted: '01:00:00' },
      { seconds: 7261, formatted: '02:01:01' },
    ];

    testCases.forEach(({ seconds, formatted }) => {
      it(`should format ${seconds}s as ${formatted}`, () => {
        expect(formatMediaDuration(seconds)).toBe(formatted);
      });

      it(`should parse ${formatted} as ${seconds}s`, () => {
        expect(parseMediaDuration(formatted)).toBe(seconds);
      });
    });
  });

  describe('Duration edge cases', () => {
    it('should handle 23:59:59 (max day time)', () => {
      const seconds = 23 * 3600 + 59 * 60 + 59;
      expect(formatMediaDuration(seconds)).toBe('23:59:59');
    });

    it('should handle 100 hours', () => {
      const seconds = 100 * 3600;
      const result = formatMediaDuration(seconds);
      expect(result).toBe('100:00:00');
    });

    it('should parse various formats consistently', () => {
      expect(parseMediaDuration('0:00')).toBe(0);
      expect(parseMediaDuration('0:01')).toBe(1);
      expect(parseMediaDuration('1:00')).toBe(60);
      expect(parseMediaDuration('10:00')).toBe(600);
    });
  });

  describe('Browser API detection', () => {
    it('isWebAudioSupported should check for AudioContext', () => {
      // Test function exists and returns expected type
      expect(typeof isWebAudioSupported).toBe('function');
    });

    it('isMediaRecorderSupported should check for MediaRecorder', () => {
      // Test function exists and returns expected type
      expect(typeof isMediaRecorderSupported).toBe('function');
    });

    it('getSupportedMimeTypes returns arrays', () => {
      const result = getSupportedMimeTypes();
      expect(result).toHaveProperty('audio');
      expect(result).toHaveProperty('video');
    });
  });

  describe('Mocked AudioContext tests', () => {
    let originalAudioContext: typeof AudioContext | undefined;

    beforeEach(() => {
      originalAudioContext = globalThis.AudioContext;
    });

    afterEach(() => {
      if (originalAudioContext) {
        globalThis.AudioContext = originalAudioContext;
      }
    });

    it('should detect when AudioContext is available', () => {
      // Mock AudioContext
      globalThis.AudioContext = vi.fn().mockImplementation(() => ({
        state: 'running',
        close: vi.fn(),
        resume: vi.fn(),
      })) as unknown as typeof AudioContext;

      expect(isWebAudioSupported()).toBe(true);
    });

    it('should detect when AudioContext is not available', () => {
      // @ts-expect-error - Testing undefined case
      globalThis.AudioContext = undefined;
      // @ts-expect-error - Testing undefined case
      globalThis.webkitAudioContext = undefined;

      expect(isWebAudioSupported()).toBe(false);
    });
  });

  describe('Mocked MediaRecorder tests', () => {
    let originalMediaRecorder: typeof MediaRecorder | undefined;

    beforeEach(() => {
      originalMediaRecorder = globalThis.MediaRecorder;
    });

    afterEach(() => {
      if (originalMediaRecorder) {
        globalThis.MediaRecorder = originalMediaRecorder;
      }
    });

    it('should detect when MediaRecorder is available', () => {
      globalThis.MediaRecorder = vi.fn().mockImplementation(() => ({
        start: vi.fn(),
        stop: vi.fn(),
      })) as unknown as typeof MediaRecorder;
      // Add static method
      (
        globalThis.MediaRecorder as unknown as {
          isTypeSupported: (type: string) => boolean;
        }
      ).isTypeSupported = vi.fn().mockReturnValue(true);

      expect(isMediaRecorderSupported()).toBe(true);
    });

    it('should return supported mime types when MediaRecorder available', () => {
      const mockIsTypeSupported = vi.fn().mockImplementation((type: string) => {
        return type.includes('webm');
      });

      globalThis.MediaRecorder = vi.fn() as unknown as typeof MediaRecorder;
      (
        globalThis.MediaRecorder as unknown as {
          isTypeSupported: typeof mockIsTypeSupported;
        }
      ).isTypeSupported = mockIsTypeSupported;

      const types = getSupportedMimeTypes();
      expect(mockIsTypeSupported).toHaveBeenCalled();
      // Should have checked various types
      expect(Array.isArray(types.audio)).toBe(true);
      expect(Array.isArray(types.video)).toBe(true);
    });
  });
});
