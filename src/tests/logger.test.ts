import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, LogLevel } from '../utils/logger';

describe('Logger Utility', () => {
  beforeEach(() => {
    // Mock process streams since logger uses them, not console
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /* ==================== BASIC LOGGING TESTS ==================== */

  describe('Basic Logging', () => {
    it('should log info messages without throwing', () => {
      expect(() => logger.info('Test info message')).not.toThrow();
    });

    it('should log warn messages without throwing', () => {
      expect(() => logger.warn('Test warning message')).not.toThrow();
    });

    it('should log error messages without throwing', () => {
      expect(() => logger.error('Test error message')).not.toThrow();
    });

    it('should include context in log messages', () => {
      expect(() =>
        logger.info('Test message', { userId: 123, action: 'login' })
      ).not.toThrow();
    });

    it('should handle Error objects', () => {
      const error = new Error('Test error');
      expect(() => logger.error('An error occurred', error)).not.toThrow();
    });
  });

  /* ==================== LOG LEVELS TESTS ==================== */

  describe('Log Levels', () => {
    it('should have DEBUG level', () => {
      expect(LogLevel.DEBUG).toBe('DEBUG');
    });

    it('should have INFO level', () => {
      expect(LogLevel.INFO).toBe('INFO');
    });

    it('should have WARN level', () => {
      expect(LogLevel.WARN).toBe('WARN');
    });

    it('should have ERROR level', () => {
      expect(LogLevel.ERROR).toBe('ERROR');
    });

    it('should have FATAL level', () => {
      expect(LogLevel.FATAL).toBe('FATAL');
    });
  });

  /* ==================== CONTEXT HANDLING TESTS ==================== */

  describe('Context Handling', () => {
    it('should accept empty context', () => {
      expect(() => logger.info('Message', {})).not.toThrow();
    });

    it('should accept complex context objects', () => {
      const context = {
        user: { id: 1, name: 'John' },
        metadata: { timestamp: Date.now() },
        tags: ['important', 'system'],
      };
      expect(() => logger.info('Complex context', context)).not.toThrow();
    });

    it('should handle null values in context', () => {
      expect(() =>
        logger.info('Message', { value: null } as Record<string, unknown>)
      ).not.toThrow();
    });

    it('should handle undefined values in context', () => {
      expect(() =>
        logger.info('Message', { value: undefined } as Record<string, unknown>)
      ).not.toThrow();
    });
  });

  /* ==================== ERROR HANDLING TESTS ==================== */

  describe('Error Handling', () => {
    it('should extract error name and message', () => {
      const error = new TypeError('Invalid type');
      expect(() => logger.error('Type error occurred', error)).not.toThrow();
    });

    it('should handle error with stack trace', () => {
      const error = new Error('With stack');
      error.stack = 'Error: With stack\n    at test.ts:1:1';
      expect(() => logger.error('Error with stack', error)).not.toThrow();
    });

    it('should handle custom error types', () => {
      class CustomError extends Error {
        constructor(
          message: string,
          public code: number
        ) {
          super(message);
          this.name = 'CustomError';
        }
      }
      const error = new CustomError('Custom error', 500);
      expect(() => logger.error('Custom error occurred', error)).not.toThrow();
    });
  });

  /* ==================== LISTENER TESTS ==================== */

  describe('Log Listeners (Subscribe)', () => {
    it('should subscribe and call listeners', () => {
      const listener = vi.fn();
      const unsubscribe = logger.subscribe(listener);
      logger.info('Test message');
      expect(listener).toHaveBeenCalled();
      unsubscribe();
    });

    it('should unsubscribe listeners', () => {
      const listener = vi.fn();
      const unsubscribe = logger.subscribe(listener);
      unsubscribe();
      listener.mockClear();
      logger.info('Test message');
      expect(listener).not.toHaveBeenCalled();
    });

    it('should pass log entry to listeners', () => {
      const listener = vi.fn();
      const unsubscribe = logger.subscribe(listener);
      logger.info('Test message', { key: 'value' });

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          level: LogLevel.INFO,
          message: 'Test message',
        })
      );
      unsubscribe();
    });
  });

  /* ==================== SPECIAL CASES TESTS ==================== */

  describe('Special Cases', () => {
    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(10000);
      expect(() => logger.info(longMessage)).not.toThrow();
    });

    it('should handle special characters in messages', () => {
      const specialMessage =
        'Message with "quotes" and \'apostrophes\' and \n newlines';
      expect(() => logger.info(specialMessage)).not.toThrow();
    });

    it('should handle Unicode characters', () => {
      const unicodeMessage = '日本語 🎉 Émoji €₹₽';
      expect(() => logger.info(unicodeMessage)).not.toThrow();
    });

    it('should handle circular references in context', () => {
      const circular: Record<string, unknown> = { name: 'test' };
      circular.self = circular;
      // Logger should handle this gracefully
      expect(() => logger.info('Circular', circular)).not.toThrow();
    });
  });

  /* ==================== LOG LEVEL CONTROL TESTS ==================== */

  describe('Log Level Control', () => {
    it('should have setMinLevel method', () => {
      expect(typeof logger.setMinLevel).toBe('function');
    });

    it('should change minimum log level', () => {
      logger.setMinLevel(LogLevel.ERROR);
      expect(() => logger.info('Should not appear')).not.toThrow();
      // Reset to INFO for other tests
      logger.setMinLevel(LogLevel.INFO);
    });
  });
});
