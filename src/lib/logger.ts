/**
 * Production-ready logging utility
 * Provides environment-aware logging with structured output
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  userId?: string;
  schoolId?: string;
  action?: string;
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? JSON.stringify(context) : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message} ${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.info(this.formatMessage('info', message, context));
    }
    // In production, you might want to send this to a logging service
    if (this.isProduction && process.env.ENABLE_PRODUCTION_LOGS === 'true') {
      // Send to logging service (e.g., Sentry, LogRocket, etc.)
      this.sendToLoggingService('info', message, context);
    }
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context));
    if (this.isProduction) {
      this.sendToLoggingService('warn', message, context);
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorDetails = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: this.isDevelopment ? error.stack : undefined
    } : error;

    console.error(this.formatMessage('error', message, { ...context, error: errorDetails }));
    
    if (this.isProduction) {
      this.sendToLoggingService('error', message, { ...context, error: errorDetails });
    }
  }

  private sendToLoggingService(level: LogLevel, message: string, context?: LogContext): void {
    // Integration point for external logging services
    // Uncomment and configure based on your logging service
    
    // === SENTRY INTEGRATION ===
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   if (level === 'error') {
    //     window.Sentry.captureMessage(message, 'error');
    //     if (context?.error instanceof Error) {
    //       window.Sentry.captureException(context.error);
    //     }
    //   } else if (level === 'warn') {
    //     window.Sentry.captureMessage(message, 'warning');
    //   }
    // }
    
    // === DATADOG RUM INTEGRATION ===
    // if (typeof window !== 'undefined' && window.DD_RUM) {
    //   window.DD_RUM.addError(message, {
    //     source: 'logger',
    //     attributes: context
    //   });
    // }
    
    // === LOGROCKET INTEGRATION ===
    // if (typeof window !== 'undefined' && window.LogRocket) {
    //   window.LogRocket.captureMessage(message, {
    //     level,
    //     extra: context
    //   });
    // }
    
    // === SERVER-SIDE WINSTON INTEGRATION ===
    // if (typeof window === 'undefined') {
    //   const winston = require('winston');
    //   const logger = winston.createLogger({
    //     level: 'info',
    //     format: winston.format.json(),
    //     transports: [
    //       new winston.transports.File({ filename: 'error.log', level: 'error' }),
    //       new winston.transports.File({ filename: 'combined.log' })
    //     ]
    //   });
    //   logger.log(level, message, context);
    // }
  }

  // Performance logging helper
  time(label: string): void {
    if (this.isDevelopment) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (this.isDevelopment) {
      console.timeEnd(label);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export type for use in other files
export type { LogContext };