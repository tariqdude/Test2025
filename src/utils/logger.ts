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
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
    details?: any;
  };
}

class Logger {
  private minLevel: LogLevel = LogLevel.INFO;

  constructor(minLevel: LogLevel = LogLevel.INFO) {
    this.minLevel = minLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  private formatMessage(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): LogEntry {
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
      if ((error as any).details) {
        logEntry.error.details = (error as any).details;
      }
    }
    return logEntry;
  }

  private output(entry: LogEntry) {
    const { timestamp, level, message, context, error } = entry;
    let logString = `[${timestamp}] [${level}] ${message}`;

    if (context && Object.keys(context).length > 0) {
      logString += ` | Context: ${JSON.stringify(context)}`;
    }
    if (error) {
      logString += ` | Error: ${error.name}: ${error.message}`;
      if (error.details) {
        logString += ` | Details: ${JSON.stringify(error.details)}`;
      }
      if (error.stack) {
        logString += `\nStack: ${error.stack}`;
      }
    }

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(logString);
        break;
      case LogLevel.INFO:
        console.info(logString);
        break;
      case LogLevel.WARN:
        console.warn(logString);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(logString);
        break;
      default:
        console.log(logString);
    }
  }

  public debug(message: string, context?: Record<string, any>) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.output(this.formatMessage(LogLevel.DEBUG, message, context));
    }
  }

  public info(message: string, context?: Record<string, any>) {
    if (this.shouldLog(LogLevel.INFO)) {
      this.output(this.formatMessage(LogLevel.INFO, message, context));
    }
  }

  public warn(message: string, context?: Record<string, any>) {
    if (this.shouldLog(LogLevel.WARN)) {
      this.output(this.formatMessage(LogLevel.WARN, message, context));
    }
  }

  public error(message: string, error?: Error, context?: Record<string, any>) {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.output(this.formatMessage(LogLevel.ERROR, message, context, error));
    }
  }

  public fatal(message: string, error?: Error, context?: Record<string, any>) {
    if (this.shouldLog(LogLevel.FATAL)) {
      this.output(this.formatMessage(LogLevel.FATAL, message, context, error));
    }
  }

  public setMinLevel(level: LogLevel) {
    this.minLevel = level;
  }
}

export const logger = new Logger(LogLevel.INFO); // Default to INFO level
