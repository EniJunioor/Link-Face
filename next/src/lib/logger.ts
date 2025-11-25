/**
 * Sistema de logs estruturados
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private formatLog(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(context && { context }),
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      })
    };

    return entry;
  }

  private output(entry: LogEntry): void {
    const json = JSON.stringify(entry);
    const shouldLog = process.env.NODE_ENV === 'development' || entry.level === LogLevel.ERROR || entry.level === LogLevel.WARN;
    
    if (shouldLog) {
      if (entry.level === LogLevel.ERROR) {
        console.error(json);
      } else if (entry.level === LogLevel.WARN) {
        console.warn(json);
      } else {
        console.log(json);
      }
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    this.output(this.formatLog(LogLevel.DEBUG, message, context));
  }

  info(message: string, context?: Record<string, any>): void {
    this.output(this.formatLog(LogLevel.INFO, message, context));
  }

  warn(message: string, context?: Record<string, any>): void {
    this.output(this.formatLog(LogLevel.WARN, message, context));
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.output(this.formatLog(LogLevel.ERROR, message, context, error));
  }
}

export const logger = new Logger();

