import * as Sentry from '@sentry/nextjs';

export class MonitoringService {
  static init() {
    // Monitoring service initialization
    if (process.env.NODE_ENV === 'production') {
      // Initialize monitoring services
    }
  }

  static captureException(error: Error, context?: Record<string, any>) {
    try {
      Sentry.captureException(error, {
        extra: context,
      });
    } catch (e) {
      console.error('Failed to capture exception:', e);
    }
  }

  static captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
    try {
      Sentry.captureMessage(message, level);
    } catch (e) {
      console.error('Failed to capture message:', e);
    }
  }

  static setUser(user: { id: string; email?: string }) {
    try {
      Sentry.setUser(user);
    } catch (e) {
      console.error('Failed to set user:', e);
    }
  }

  static setContext(key: string, context: Record<string, any>) {
    try {
      Sentry.setContext(key, context);
    } catch (e) {
      console.error('Failed to set context:', e);
    }
  }
}