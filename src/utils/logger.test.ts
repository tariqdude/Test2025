import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger, LogLevel } from './logger';

describe('Logger', () => {
  let dispatchEventSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should log info messages', () => {
    const logger = new Logger(LogLevel.INFO);
    logger.info('test message');
    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'logger:message',
        detail: expect.objectContaining({
          message: 'test message',
          level: LogLevel.INFO,
        }),
      })
    );
  });

  it('should not log debug messages if level is INFO', () => {
    const logger = new Logger(LogLevel.INFO);
    logger.debug('test message');
    expect(dispatchEventSpy).not.toHaveBeenCalled();
  });

  it('should log debug messages if level is DEBUG', () => {
    const logger = new Logger(LogLevel.DEBUG);
    logger.debug('test message');
    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          message: 'test message',
          level: LogLevel.DEBUG,
        }),
      })
    );
  });

  it('should log warn messages', () => {
    const logger = new Logger(LogLevel.INFO);
    logger.warn('test message');
    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          message: 'test message',
          level: LogLevel.WARN,
        }),
      })
    );
  });

  it('should log error messages', () => {
    const logger = new Logger(LogLevel.INFO);
    logger.error('test message');
    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          message: 'test message',
          level: LogLevel.ERROR,
        }),
      })
    );
  });

  it('should include context', () => {
    const logger = new Logger(LogLevel.INFO);
    logger.info('test message', { foo: 'bar' });
    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          context: { foo: 'bar' },
        }),
      })
    );
  });

  it('should include error details', () => {
    const logger = new Logger(LogLevel.INFO);
    const error = new Error('test error');
    logger.error('test message', error);
    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          error: expect.objectContaining({
            message: 'test error',
          }),
        }),
      })
    );
  });
});
