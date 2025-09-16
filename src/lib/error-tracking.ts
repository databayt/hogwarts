/**
 * Global error tracking and monitoring utilities
 * Provides unhandled error catching and reporting
 */

import { logger } from './logger';

interface ErrorTrackingConfig {
  enableGlobalHandlers: boolean;
  enableUnhandledRejectionHandler: boolean;
  enableBeforeUnloadHandler: boolean;
}

class ErrorTracking {
  private config: ErrorTrackingConfig;
  private initialized = false;

  constructor(config: Partial<ErrorTrackingConfig> = {}) {
    this.config = {
      enableGlobalHandlers: true,
      enableUnhandledRejectionHandler: true,
      enableBeforeUnloadHandler: false,
      ...config,
    };
  }

  /**
   * Initialize global error handlers
   * Should be called once in the application root
   */
  init() {
    if (this.initialized) {
      return;
    }

    if (typeof window !== 'undefined') {
      this.initBrowserHandlers();
    } else {
      this.initServerHandlers();
    }

    this.initialized = true;
    logger.info('Error tracking initialized', {
      action: 'error_tracking_init',
      environment: typeof window !== 'undefined' ? 'browser' : 'server',
      config: this.config,
    });
  }

  private initBrowserHandlers() {
    if (this.config.enableGlobalHandlers) {
      // Catch unhandled JavaScript errors
      window.addEventListener('error', (event) => {
        logger.error('Unhandled JavaScript error', event.error || new Error(event.message), {
          action: 'unhandled_js_error',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          message: event.message,
          url: window.location.href,
          userAgent: navigator.userAgent,
        });
      });

      // Catch unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        logger.error('Unhandled promise rejection', event.reason, {
          action: 'unhandled_promise_rejection',
          url: window.location.href,
          userAgent: navigator.userAgent,
        });

        // Prevent the default browser console error
        event.preventDefault();
      });
    }

    if (this.config.enableBeforeUnloadHandler) {
      // Track page unloads that might indicate crashes
      window.addEventListener('beforeunload', () => {
        logger.info('Page unload detected', {
          action: 'page_unload',
          url: window.location.href,
          timestamp: new Date().toISOString(),
        });
      });
    }

    // Track navigation errors (client-side routing)
    // Note: Navigation API is experimental and not widely supported yet
    if ('navigation' in window) {
      (window as any).navigation.addEventListener('navigateerror', (event: any) => {
        logger.error('Navigation error', event.error, {
          action: 'navigation_error',
          url: window.location.href,
          destination: event.destination?.url,
        });
      });
    }
  }

  private initServerHandlers() {
    if (this.config.enableGlobalHandlers) {
      // Catch unhandled Node.js errors
      process.on('uncaughtException', (error) => {
        logger.error('Uncaught exception', error, {
          action: 'uncaught_exception',
          pid: process.pid,
          platform: process.platform,
          nodeVersion: process.version,
        });

        // In production, we might want to exit gracefully
        if (process.env.NODE_ENV === 'production') {
          setTimeout(() => {
            process.exit(1);
          }, 1000);
        }
      });
    }

    if (this.config.enableUnhandledRejectionHandler) {
      // Catch unhandled promise rejections in Node.js
      process.on('unhandledRejection', (reason, promise) => {
        logger.error('Unhandled promise rejection', reason instanceof Error ? reason : new Error(String(reason)), {
          action: 'unhandled_promise_rejection',
          pid: process.pid,
          platform: process.platform,
          nodeVersion: process.version,
          promise: promise.toString(),
        });
      });
    }

    // Catch warnings (like deprecation warnings)
    process.on('warning', (warning) => {
      logger.warn('Node.js warning', {
        action: 'node_warning',
        name: warning.name,
        message: warning.message,
        stack: warning.stack,
        pid: process.pid,
      });
    });
  }

  /**
   * Manually report an error
   */
  reportError(error: Error, context?: Record<string, any>) {
    logger.error('Manual error report', error, {
      action: 'manual_error_report',
      ...context,
    });
  }

  /**
   * Track a custom event
   */
  trackEvent(event: string, properties?: Record<string, any>) {
    logger.info(`Event: ${event}`, {
      action: 'track_event',
      event,
      ...properties,
    });
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metric: string, value: number, unit: string = 'ms') {
    logger.info(`Performance: ${metric}`, {
      action: 'track_performance',
      metric,
      value,
      unit,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track user actions for debugging
   */
  trackUserAction(action: string, element?: string, value?: any) {
    logger.info(`User action: ${action}`, {
      action: 'track_user_action',
      userAction: action,
      element,
      value,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    });
  }
}

// Export singleton instance
export const errorTracking = new ErrorTracking();

// Convenience functions
export const reportError = (error: Error, context?: Record<string, any>) =>
  errorTracking.reportError(error, context);

export const trackEvent = (event: string, properties?: Record<string, any>) =>
  errorTracking.trackEvent(event, properties);

export const trackPerformance = (metric: string, value: number, unit?: string) =>
  errorTracking.trackPerformance(metric, value, unit);

export const trackUserAction = (action: string, element?: string, value?: any) =>
  errorTracking.trackUserAction(action, element, value);

// Initialize error tracking if not already done
if (typeof window !== 'undefined') {
  // Browser initialization
  errorTracking.init();
} else {
  // Server initialization
  errorTracking.init();
}