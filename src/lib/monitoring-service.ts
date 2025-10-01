/**
 * Production Monitoring Service
 * Integrates error tracking, performance monitoring, and analytics
 */

import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/logger';

export interface MonitoringEvent {
  name: string;
  category: 'error' | 'performance' | 'user_action' | 'api_call' | 'business';
  data?: Record<string, any>;
  userId?: string;
  schoolId?: string;
  severity?: 'info' | 'warning' | 'error' | 'critical';
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percent';
  tags?: Record<string, string>;
}

export interface ErrorReport {
  error: Error | string;
  context?: Record<string, any>;
  userId?: string;
  schoolId?: string;
  severity?: 'error' | 'warning' | 'critical';
}

export interface UserActivity {
  action: string;
  resource?: string;
  userId: string;
  schoolId?: string;
  metadata?: Record<string, any>;
}

class MonitoringService {
  private isInitialized = false;
  private metricsBuffer: PerformanceMetric[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (this.isInitialized) return;

    // Only initialize on server side
    if (typeof window === 'undefined') {
      // Start metrics flush interval (every 30 seconds)
      this.flushInterval = setInterval(() => {
        this.flushMetrics();
      }, 30000);

      logger.info('Monitoring service initialized', {
        action: 'monitoring_initialized',
        sentryEnabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
      });
    }

    this.isInitialized = true;
  }

  /**
   * Track a custom event
   */
  trackEvent(event: MonitoringEvent) {
    try {
      // Log the event
      logger.info('Monitoring event', {
        action: 'monitoring_event',
        eventName: event.name,
        category: event.category,
        ...event.data,
        userId: event.userId,
        schoolId: event.schoolId,
      });

      // Send to Sentry as breadcrumb
      if (typeof window !== 'undefined' && Sentry.addBreadcrumb) {
        // Map 'critical' to 'error' since Sentry doesn't have a 'critical' level
        const sentryLevel = event.severity === 'critical' ? 'error' : (event.severity || 'info');
        Sentry.addBreadcrumb({
          message: event.name,
          category: event.category,
          level: sentryLevel as any,
          data: event.data,
        });
      }

      // Send to analytics (Vercel Analytics)
      if (typeof window !== 'undefined' && (window as any).va) {
        (window as any).va('event', {
          name: event.name,
          category: event.category,
          ...event.data,
        });
      }
    } catch (error) {
      logger.error('Failed to track event', error as Error, {
        eventName: event.name,
      });
    }
  }

  /**
   * Report an error
   */
  reportError(errorReport: ErrorReport) {
    try {
      const error = errorReport.error instanceof Error
        ? errorReport.error
        : new Error(String(errorReport.error));

      // Log the error
      logger.error(error.message, error, {
        ...errorReport.context,
        userId: errorReport.userId,
        schoolId: errorReport.schoolId,
        severity: errorReport.severity,
      });

      // Send to Sentry
      if (Sentry.captureException) {
        Sentry.withScope((scope) => {
          if (errorReport.userId) {
            scope.setUser({ id: errorReport.userId });
          }
          if (errorReport.schoolId) {
            scope.setContext('school', { id: errorReport.schoolId });
          }
          if (errorReport.context) {
            scope.setContext('additional', errorReport.context);
          }
          // Map 'critical' to 'error' since Sentry doesn't have a 'critical' level
          const sentryLevel = errorReport.severity === 'critical' ? 'error' : (errorReport.severity || 'error');
          scope.setLevel(sentryLevel as any);

          Sentry.captureException(error);
        });
      }
    } catch (err) {
      console.error('Failed to report error:', err);
    }
  }

  /**
   * Track performance metric
   */
  trackPerformance(metric: PerformanceMetric) {
    try {
      // Buffer the metric
      this.metricsBuffer.push(metric);

      // Log immediately if it's critical
      if (metric.value > 5000 && metric.unit === 'ms') {
        logger.warn('Slow performance detected', {
          action: 'slow_performance',
          metric: metric.name,
          value: metric.value,
          unit: metric.unit,
          ...metric.tags,
        });
      }

      // Send to Sentry as measurement
      try {
        const client = Sentry.getClient();
        if (client) {
          // Log metric to Sentry via custom context
          Sentry.setContext('performance_metric', {
            name: metric.name,
            value: metric.value,
            unit: metric.unit,
            tags: metric.tags,
          });
        }
      } catch (err) {
        // Fallback: just log it
        console.debug('Performance metric:', metric);
      }
    } catch (error) {
      logger.error('Failed to track performance metric', error as Error);
    }
  }

  /**
   * Track user activity
   */
  trackUserActivity(activity: UserActivity) {
    try {
      this.trackEvent({
        name: activity.action,
        category: 'user_action',
        data: {
          resource: activity.resource,
          ...activity.metadata,
        },
        userId: activity.userId,
        schoolId: activity.schoolId,
      });
    } catch (error) {
      logger.error('Failed to track user activity', error as Error);
    }
  }

  /**
   * Track API call
   */
  trackApiCall(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    userId?: string,
    schoolId?: string
  ) {
    try {
      const isError = statusCode >= 400;

      this.trackEvent({
        name: 'api_call',
        category: 'api_call',
        severity: isError ? 'error' : 'info',
        data: {
          method,
          path,
          statusCode,
          duration,
          isError,
        },
        userId,
        schoolId,
      });

      // Track performance
      this.trackPerformance({
        name: `api.${method.toLowerCase()}.${path.replace(/\//g, '_')}`,
        value: duration,
        unit: 'ms',
        tags: {
          statusCode: String(statusCode),
          isError: String(isError),
        },
      });
    } catch (error) {
      logger.error('Failed to track API call', error as Error);
    }
  }

  /**
   * Track business metric
   */
  trackBusinessMetric(
    name: string,
    value: number,
    metadata?: Record<string, any>
  ) {
    try {
      this.trackEvent({
        name,
        category: 'business',
        data: {
          value,
          ...metadata,
        },
      });

      // Log important business metrics
      logger.info('Business metric tracked', {
        action: 'business_metric',
        metric: name,
        value,
        ...metadata,
      });
    } catch (error) {
      logger.error('Failed to track business metric', error as Error);
    }
  }

  /**
   * Set user context for monitoring
   */
  setUserContext(userId: string, email?: string, role?: string) {
    try {
      if (Sentry.setUser) {
        Sentry.setUser({
          id: userId,
          email,
          role,
        });
      }
    } catch (error) {
      logger.error('Failed to set user context', error as Error);
    }
  }

  /**
   * Set school context
   */
  setSchoolContext(schoolId: string, schoolName?: string) {
    try {
      if (Sentry.setContext) {
        Sentry.setContext('school', {
          id: schoolId,
          name: schoolName,
        });
      }
    } catch (error) {
      logger.error('Failed to set school context', error as Error);
    }
  }

  /**
   * Flush buffered metrics
   */
  private async flushMetrics() {
    if (this.metricsBuffer.length === 0) return;

    try {
      const metrics = [...this.metricsBuffer];
      this.metricsBuffer = [];

      // Aggregate metrics
      const aggregated: Record<string, { sum: number; count: number; max: number; min: number }> = {};

      for (const metric of metrics) {
        const key = `${metric.name}_${metric.unit}`;
        if (!aggregated[key]) {
          aggregated[key] = {
            sum: 0,
            count: 0,
            max: -Infinity,
            min: Infinity,
          };
        }

        aggregated[key].sum += metric.value;
        aggregated[key].count += 1;
        aggregated[key].max = Math.max(aggregated[key].max, metric.value);
        aggregated[key].min = Math.min(aggregated[key].min, metric.value);
      }

      // Log aggregated metrics
      for (const [key, stats] of Object.entries(aggregated)) {
        const [name, unit] = key.split('_');
        logger.info('Aggregated metrics', {
          action: 'metrics_aggregated',
          metric: name,
          unit,
          average: stats.sum / stats.count,
          max: stats.max,
          min: stats.min,
          count: stats.count,
        });
      }
    } catch (error) {
      logger.error('Failed to flush metrics', error as Error);
    }
  }

  /**
   * Create a performance timer
   */
  startTimer(name: string): () => void {
    const startTime = Date.now();

    return () => {
      const duration = Date.now() - startTime;
      this.trackPerformance({
        name,
        value: duration,
        unit: 'ms',
      });
    };
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flushMetrics();
  }
}

// Create singleton instance only on server
const monitoringServiceInstance = typeof window === 'undefined' ? new MonitoringService() : null;

// Export the instance (will be null on client)
export const monitoringService = monitoringServiceInstance;

// Export convenience functions with client-side safety
export const trackEvent = (event: MonitoringEvent) => {
  if (typeof window === 'undefined' && monitoringServiceInstance) {
    monitoringServiceInstance.trackEvent(event);
  }
};

export const reportError = (errorReport: ErrorReport) => {
  if (typeof window === 'undefined' && monitoringServiceInstance) {
    monitoringServiceInstance.reportError(errorReport);
  }
};

export const trackPerformance = (metric: PerformanceMetric) => {
  if (typeof window === 'undefined' && monitoringServiceInstance) {
    monitoringServiceInstance.trackPerformance(metric);
  }
};

export const trackUserActivity = (activity: UserActivity) => {
  if (typeof window === 'undefined' && monitoringServiceInstance) {
    monitoringServiceInstance.trackUserActivity(activity);
  }
};
export const trackApiCall = (
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  userId?: string,
  schoolId?: string
) => {
  if (typeof window === 'undefined' && monitoringServiceInstance) {
    monitoringServiceInstance.trackApiCall(method, path, statusCode, duration, userId, schoolId);
  }
};

export const trackBusinessMetric = (
  name: string,
  value: number,
  metadata?: Record<string, any>
) => {
  if (typeof window === 'undefined' && monitoringServiceInstance) {
    monitoringServiceInstance.trackBusinessMetric(name, value, metadata);
  }
};

export const startTimer = (name: string) => {
  if (typeof window === 'undefined' && monitoringServiceInstance) {
    return monitoringServiceInstance.startTimer(name);
  }
  return () => {}; // Return no-op function on client
};