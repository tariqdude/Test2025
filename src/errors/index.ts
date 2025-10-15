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

export class AnalysisError extends AppError {
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
    Object.setPrototypeOf(this, AnalysisError.prototype);
  }
}

export class ConfigurationError extends AppError {
  constructor(configKey: string, message = 'Invalid configuration') {
    super(`${message}: ${configKey}`, 'CONFIGURATION_ERROR', { configKey });
    this.name = 'ConfigurationError';
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }
}

export class NetworkError extends AppError {
  public status: number;

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
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}
