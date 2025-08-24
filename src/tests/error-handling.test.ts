import { describe, it, expect } from 'vitest';
import {
  AppError,
  AnalysisError,
  CommandExecutionError,
  FileSystemError,
  ConfigurationError,
  NetworkError,
} from '../errors';

describe('Error Handling System', () => {
  describe('AppError (Base Class)', () => {
    it('should create basic app error with message and code', () => {
      const error = new AppError('Test error message', 'TEST_ERROR');

      expect(error.name).toBe('AppError');
      expect(error.message).toBe('Test error message');
      expect(error.code).toBe('TEST_ERROR');
      expect(error instanceof Error).toBe(true);
      expect(error instanceof AppError).toBe(true);
    });

    it('should use default error code when not provided', () => {
      const error = new AppError('Test message');

      expect(error.code).toBe('APP_ERROR');
    });

    it('should store additional details', () => {
      const details = { extra: 'info', count: 42 };
      const error = new AppError('Test', 'TEST', details);

      expect(error.details).toEqual(details);
    });
  });

  describe('AnalysisError', () => {
    it('should create analysis error with checker name and original error', () => {
      const originalError = new Error('Original problem');
      const analysisError = new AnalysisError('SyntaxChecker', originalError);

      expect(analysisError.name).toBe('AnalysisError');
      expect(analysisError.code).toBe('ANALYSIS_ERROR');
      expect(analysisError.message).toContain('SyntaxChecker');
      expect(analysisError.message).toContain('Original problem');
      expect((analysisError.details as any).checkerName).toBe('SyntaxChecker');
      expect((analysisError.details as any).originalError).toBe(originalError);
    });

    it('should use custom message when provided', () => {
      const originalError = new Error('File not found');
      const analysisError = new AnalysisError(
        'FileChecker',
        originalError,
        'Custom analysis failed'
      );

      expect(analysisError.message).toContain('Custom analysis failed');
      expect(analysisError.message).toContain('FileChecker');
    });
  });

  describe('CommandExecutionError', () => {
    it('should store all command execution details', () => {
      const error = new CommandExecutionError(
        'npm test',
        1,
        'SIGTERM' as NodeJS.Signals,
        'Test output',
        'Error output'
      );

      expect(error.name).toBe('CommandExecutionError');
      expect(error.code).toBe('COMMAND_EXECUTION_ERROR');
      expect((error.details as any).command).toBe('npm test');
      expect((error.details as any).exitCode).toBe(1);
      expect((error.details as any).signal).toBe('SIGTERM');
      expect((error.details as any).stdout).toBe('Test output');
      expect((error.details as any).stderr).toBe('Error output');
    });

    it('should handle null exit code and signal', () => {
      const error = new CommandExecutionError(
        'long-running-command',
        null,
        null,
        '',
        'Process killed'
      );

      expect((error.details as any).exitCode).toBeNull();
      expect((error.details as any).signal).toBeNull();
    });
  });

  describe('FileSystemError', () => {
    it('should store file operation details', () => {
      const originalError = new Error('ENOENT: no such file or directory');
      const fsError = new FileSystemError(
        'read',
        '/path/to/file.ts',
        originalError
      );

      expect(fsError.name).toBe('FileSystemError');
      expect(fsError.code).toBe('FILE_SYSTEM_ERROR');
      expect(fsError.message).toContain('read on /path/to/file.ts');
      expect(fsError.message).toContain('ENOENT');
      expect((fsError.details as any).operation).toBe('read');
      expect((fsError.details as any).filePath).toBe('/path/to/file.ts');
      expect((fsError.details as any).originalError).toBe(originalError);
    });

    it('should use custom message when provided', () => {
      const originalError = new Error('Permission denied');
      const fsError = new FileSystemError(
        'write',
        '/readonly/file.txt',
        originalError,
        'Custom file operation failed'
      );

      expect(fsError.message).toContain('Custom file operation failed');
    });
  });

  describe('ConfigurationError', () => {
    it('should store configuration key and message', () => {
      const error = new ConfigurationError(
        'projectRoot',
        'Invalid path specified'
      );

      expect(error.name).toBe('ConfigurationError');
      expect(error.code).toBe('CONFIGURATION_ERROR');
      expect(error.message).toContain('Invalid path specified');
      expect(error.message).toContain('projectRoot');
      expect((error.details as any).configKey).toBe('projectRoot');
    });

    it('should use default message when not provided', () => {
      const error = new ConfigurationError('timeout');

      expect(error.message).toContain('Invalid configuration');
      expect(error.message).toContain('timeout');
    });
  });

  describe('NetworkError', () => {
    it('should store network request details', () => {
      const originalError = new Error('Connection timeout');
      const networkError = new NetworkError(
        'https://api.example.com',
        500,
        originalError
      );

      expect(networkError.name).toBe('NetworkError');
      expect(networkError.code).toBe('NETWORK_ERROR');
      expect(networkError.message).toContain('https://api.example.com');
      expect(networkError.message).toContain('500');
      expect(networkError.message).toContain('Connection timeout');
      expect((networkError.details as any).url).toBe('https://api.example.com');
      expect((networkError.details as any).status).toBe(500);
      expect((networkError.details as any).originalError).toBe(originalError);
    });

    it('should work without original error', () => {
      const networkError = new NetworkError('https://api.test.com', 404);

      expect((networkError.details as any).originalError).toBeUndefined();
      expect(networkError.message).toContain('https://api.test.com');
      expect(networkError.message).toContain('404');
    });

    it('should use custom message when provided', () => {
      const networkError = new NetworkError(
        'https://custom.api.com',
        503,
        undefined,
        'Custom network failure'
      );

      expect(networkError.message).toContain('Custom network failure');
    });
  });

  describe('Error Inheritance and Prototype Chain', () => {
    it('should maintain proper prototype chain for all error types', () => {
      const errors = [
        new AppError('test'),
        new AnalysisError('test', new Error('test')),
        new CommandExecutionError('test', 1, null, '', ''),
        new FileSystemError('test', 'test', new Error('test')),
        new ConfigurationError('test'),
        new NetworkError('test', 500),
      ];

      errors.forEach(error => {
        expect(error instanceof Error).toBe(true);
        expect(error instanceof AppError).toBe(true);
        expect(Object.getPrototypeOf(error)).toBe(error.constructor.prototype);
      });
    });

    it('should be catchable as base Error type', () => {
      const errors = [
        new AnalysisError('test', new Error('test')),
        new CommandExecutionError('test', 1, null, '', ''),
        new NetworkError('test', 500),
      ];

      errors.forEach(error => {
        try {
          throw error;
        } catch (caught) {
          expect(caught instanceof Error).toBe(true);
          expect(caught instanceof AppError).toBe(true);
        }
      });
    });
  });

  describe('Error Serialization', () => {
    it('should serialize errors with all relevant properties', () => {
      const originalError = new Error('Original');
      const analysisError = new AnalysisError('TestAnalyzer', originalError);

      const serialized = JSON.parse(JSON.stringify(analysisError));

      expect(serialized.name).toBe('AnalysisError');
      expect(serialized.message).toBeDefined();
      expect(typeof serialized.message).toBe('string');
      expect(serialized.code).toBe('ANALYSIS_ERROR');
      expect(serialized.details).toBeDefined();
      expect((serialized.details as any).checkerName).toBe('TestAnalyzer');
    });
  });
});
