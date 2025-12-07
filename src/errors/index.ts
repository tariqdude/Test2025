/**
 * Error handling utilities and custom error types
 * @module errors
 * @description Provides custom error classes for different failure scenarios,
 * type guards for error checking, Result types for safer error handling,
 * and utilities for error wrapping and formatting.
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code = 'APP_ERROR',
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      stack: this.stack,
    };
  }
}

export class CommandExecutionError extends AppError {
  constructor(
    command: string,
    exitCode: number | null,
    signal: NodeJS.Signals | null,
    stdout: string,
    stderr: string,
    message = 'Command execution failed'
  ) {
    super(message, 'COMMAND_EXECUTION_ERROR', {
      command,
      exitCode,
      signal,
      stdout,
      stderr,
    });
    this.name = 'CommandExecutionError';
    Object.setPrototypeOf(this, CommandExecutionError.prototype);
  }
}

export class FileSystemError extends AppError {
  constructor(
    operation: string,
    filePath: string,
    originalError: Error,
    message = 'File system operation failed'
  ) {
    super(
      `${message}: ${operation} on ${filePath}. Original error: ${originalError.message}`,
      'FILE_SYSTEM_ERROR',
      { operation, filePath, originalError }
    );
    this.name = 'FileSystemError';
    Object.setPrototypeOf(this, FileSystemError.prototype);
  }
}

/**
 * Error thrown when analysis fails for a specific checker
 */
export class AnalysisError extends AppError {
  /** Name of the analyzer that failed */
  public readonly checkerName: string;

  constructor(
    checkerName: string,
    originalError: Error,
    message = 'Analysis failed for checker'
  ) {
    super(
      `${message}: ${checkerName}. Original error: ${originalError.message}`,
      'ANALYSIS_ERROR',
      { checkerName, originalError }
    );
    this.name = 'AnalysisError';
    this.checkerName = checkerName;
    Object.setPrototypeOf(this, AnalysisError.prototype);
  }

  /**
   * Check if error is recoverable (non-fatal)
   */
  isRecoverable(): boolean {
    return true; // Analysis errors are generally recoverable
  }
}

/**
 * Error thrown for invalid configuration
 */
export class ConfigurationError extends AppError {
  /** Configuration key that caused the error */
  public readonly configKey: string;

  constructor(configKey: string, message = 'Invalid configuration') {
    super(`${message}: ${configKey}`, 'CONFIGURATION_ERROR', { configKey });
    this.name = 'ConfigurationError';
    this.configKey = configKey;
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }
}

/**
 * Error thrown for network/HTTP request failures
 */
export class NetworkError extends AppError {
  /** HTTP status code */
  public readonly status: number;
  /** Request URL */
  public readonly url: string;

  constructor(
    url: string,
    status: number,
    originalError?: Error,
    message = 'Network request failed'
  ) {
    super(
      `${message}: ${url} responded with status ${status}. Original error: ${originalError?.message}`,
      'NETWORK_ERROR',
      { url, status, originalError }
    );
    this.name = 'NetworkError';
    this.status = status;
    this.url = url;
    Object.setPrototypeOf(this, NetworkError.prototype);
  }

  /**
   * Check if the error is retryable based on status code
   */
  isRetryable(): boolean {
    return this.status >= 500 || this.status === 429;
  }
}

/**
 * Error thrown for validation failures
 */
export class ValidationError extends AppError {
  /** Field that failed validation */
  public readonly field: string;
  /** Validation constraints that were violated */
  public readonly constraints: string[];

  constructor(
    field: string,
    constraints: string[],
    message = 'Validation failed'
  ) {
    super(
      `${message}: ${field} - ${constraints.join(', ')}`,
      'VALIDATION_ERROR',
      {
        field,
        constraints,
      }
    );
    this.name = 'ValidationError';
    this.field = field;
    this.constraints = constraints;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Error thrown when a timeout occurs
 */
export class TimeoutError extends AppError {
  /** Timeout duration in milliseconds */
  public readonly timeoutMs: number;
  /** Operation that timed out */
  public readonly operation: string;

  constructor(operation: string, timeoutMs: number) {
    super(
      `Operation '${operation}' timed out after ${timeoutMs}ms`,
      'TIMEOUT_ERROR',
      { operation, timeoutMs }
    );
    this.name = 'TimeoutError';
    this.timeoutMs = timeoutMs;
    this.operation = operation;
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/* ==================== ERROR UTILITIES ==================== */

/**
 * Type guard to check if a value is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Type guard to check if a value is an Error
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Safely extract error message from any value
 */
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'An unknown error occurred';
}

/**
 * Wrap an unknown error in an AppError
 */
export function wrapError(error: unknown, context?: string): AppError {
  if (isAppError(error)) {
    return error;
  }

  const message = context
    ? `${context}: ${getErrorMessage(error)}`
    : getErrorMessage(error);

  return new AppError(message, 'WRAPPED_ERROR', {
    originalError: isError(error) ? error : undefined,
    originalValue: !isError(error) ? error : undefined,
  });
}

/**
 * Create a formatted error for logging
 */
export function formatErrorForLogging(error: unknown): Record<string, unknown> {
  if (isAppError(error)) {
    return error.toJSON();
  }

  if (isError(error)) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    type: typeof error,
    value: String(error),
  };
}

/**
 * Retry an async operation with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
    shouldRetry?: (error: unknown, attempt: number) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2,
    shouldRetry = () => true,
  } = options;

  let lastError: unknown;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt >= maxRetries || !shouldRetry(error, attempt)) {
        throw error;
      }

      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * backoffFactor, maxDelay);
    }
  }

  throw lastError;
}

/**
 * Result type for operations that can fail
 * Similar to Rust's Result<T, E>
 */
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Create a successful result
 */
export function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

/**
 * Create a failed result
 */
export function err<E>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * Wrap an async function to return a Result instead of throwing
 */
export async function tryCatch<T>(
  fn: () => Promise<T>
): Promise<Result<T, Error>> {
  try {
    const data = await fn();
    return ok(data);
  } catch (error) {
    return err(isError(error) ? error : new Error(getErrorMessage(error)));
  }
}

/**
 * Wrap a sync function to return a Result instead of throwing
 */
export function tryCatchSync<T>(fn: () => T): Result<T, Error> {
  try {
    const data = fn();
    return ok(data);
  } catch (error) {
    return err(isError(error) ? error : new Error(getErrorMessage(error)));
  }
}

/**
 * Chain multiple Result operations
 */
export function mapResult<T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => U
): Result<U, E> {
  if (result.success) {
    return ok(fn(result.data));
  }
  return result;
}

/**
 * Unwrap a Result or throw the error
 */
export function unwrapResult<T, E>(result: Result<T, E>): T {
  if (result.success) {
    return result.data;
  }
  throw result.error;
}

/**
 * Unwrap a Result or return a default value
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (result.success) {
    return result.data;
  }
  return defaultValue;
}
