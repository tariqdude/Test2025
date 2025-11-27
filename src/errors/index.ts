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
