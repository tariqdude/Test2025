export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL',
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
    details?: unknown;
  };
}

type ErrorWithDetails = Error & { details?: unknown };
type LogListener = (entry: LogEntry) => void;

export class Logger {
  private minLevel: LogLevel = LogLevel.INFO;
  private listeners: Set<LogListener> = new Set();

  constructor(minLevel: LogLevel = LogLevel.INFO) {
    this.minLevel = minLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [
      LogLevel.DEBUG,
      LogLevel.INFO,
      LogLevel.WARN,
      LogLevel.ERROR,
      LogLevel.FATAL,
    ];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): LogEntry {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    if (context) {
      logEntry.context = context;
    }

    if (error) {
      logEntry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
      // If it's a custom error with details, include them
      if (this.hasDetails(error)) {
        logEntry.error.details = error.details;
      }
    }
    return logEntry;
  }

  private hasDetails(error: Error): error is ErrorWithDetails {
    return 'details' in error;
  }

  private formatForStream(entry: LogEntry): string {
    const { timestamp, level, message, context, error } = entry;
    let logString = `[${timestamp}] [${level}] ${message}`;

    if (context) {
      try {
        logString += ` | Context: ${JSON.stringify(context)}`;
      } catch {
        logString += ' | Context: [unserializable]';
      }
    }

    if (error) {
      logString += ` | Error: ${error.name}: ${error.message}`;
      if (error.details) {
        try {
          logString += ` | Details: ${JSON.stringify(error.details)}`;
        } catch {
          logString += ' | Details: [unserializable]';
        }
      }
      if (error.stack) {
        logString += `\nStack: ${error.stack}`;
      }
    }

    return logString;
  }

  private emit(entry: LogEntry, formatted: string): void {
    this.listeners.forEach(listener => listener(entry));

    if (
      typeof window !== 'undefined' &&
      typeof window.dispatchEvent === 'function'
    ) {
      try {
        window.dispatchEvent(
          new CustomEvent<LogEntry>('logger:message', { detail: entry })
        );
        return;
      } catch {
        // Ignore environments without CustomEvent support
      }
    }

    if (typeof process !== 'undefined') {
      const stream =
        entry.level === LogLevel.ERROR || entry.level === LogLevel.FATAL
          ? process.stderr
          : process.stdout;
      if (stream && typeof stream.write === 'function') {
        stream.write(`${formatted}\n`);
      }
    }
  }

  public subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private output(entry: LogEntry) {
    const formatted = this.formatForStream(entry);
    this.emit(entry, formatted);
  }

  public debug(message: string, context?: Record<string, unknown>) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.output(this.formatMessage(LogLevel.DEBUG, message, context));
    }
  }

  public info(message: string, context?: Record<string, unknown>) {
    if (this.shouldLog(LogLevel.INFO)) {
      this.output(this.formatMessage(LogLevel.INFO, message, context));
    }
  }

  public warn(message: string, context?: Record<string, unknown>) {
    if (this.shouldLog(LogLevel.WARN)) {
      this.output(this.formatMessage(LogLevel.WARN, message, context));
    }
  }

  public error(
    message: string,
    error?: Error,
    context?: Record<string, unknown>
  ) {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.output(this.formatMessage(LogLevel.ERROR, message, context, error));
    }
  }

  public fatal(
    message: string,
    error?: Error,
    context?: Record<string, unknown>
  ) {
    if (this.shouldLog(LogLevel.FATAL)) {
      this.output(this.formatMessage(LogLevel.FATAL, message, context, error));
    }
  }

  public setMinLevel(level: LogLevel) {
    this.minLevel = level;
  }
}

export const logger = new Logger(LogLevel.INFO); // Default to INFO level
