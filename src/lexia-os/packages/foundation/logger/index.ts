import { Clock } from '../clock/index.js';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  context?: Record<string, any>;
}

export class Logger {
  private static format(entry: LogEntry): string {
    return JSON.stringify(entry);
  }

  private static log(level: LogLevel, message: string, context?: Record<string, any>) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: Clock.timestamp(),
      context
    };

    // Esto encapsula console.log. Mañana puede enviar logs a ElasticSearch o Datadog
    // sin que el dominio se entere.
    if (level === 'error') {
      console.error(this.format(entry));
    } else if (level === 'warn') {
      console.warn(this.format(entry));
    } else {
      console.log(this.format(entry));
    }
  }

  static info(message: string, context?: Record<string, any>) {
    this.log('info', message, context);
  }

  static warn(message: string, context?: Record<string, any>) {
    this.log('warn', message, context);
  }

  static error(message: string, context?: Record<string, any>) {
    this.log('error', message, context);
  }

  static debug(message: string, context?: Record<string, any>) {
    this.log('debug', message, context);
  }
}
