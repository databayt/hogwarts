'use client';

import { useEffect, useCallback, useRef } from 'react';
import { performanceMonitor } from '@/lib/performance-monitor';

/**
 * Hook for tracking component performance and user interactions
 */
export function usePerformance(componentName: string) {
  const mountTimeRef = useRef<number>(Date.now());
  const renderCountRef = useRef<number>(0);

  useEffect(() => {
    // Track component mount time
    const mountDuration = Date.now() - mountTimeRef.current;
    performanceMonitor.recordMetric(`component_mount_${componentName}`, mountDuration, 'ms', {
      type: 'component_performance',
      componentName,
      renderCount: renderCountRef.current
    });

    // Track page load if this is the first render
    if (renderCountRef.current === 0) {
      performanceMonitor.trackPageLoad(componentName);
    }

    renderCountRef.current++;

    return () => {
      // Track component unmount
      performanceMonitor.recordMetric(`component_unmount_${componentName}`, 1, 'count', {
        type: 'component_lifecycle',
        componentName,
        totalRenders: renderCountRef.current
      });
    };
  }, [componentName]);

  const trackUserAction = useCallback((action: string, element?: string, value?: any) => {
    performanceMonitor.recordMetric(`user_action_${action}`, 1, 'count', {
      type: 'user_interaction',
      action,
      element,
      value,
      componentName,
      timestamp: Date.now()
    });
  }, [componentName]);

  const trackAsyncOperation = useCallback(async <T>(
    operationName: string,
    operation: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> => {
    return performanceMonitor.trackApiCall(`${componentName}_${operationName}`, operation, {
      componentName,
      ...context
    });
  }, [componentName]);

  const startTimer = useCallback((timerName: string) => {
    performanceMonitor.startTimer(`${componentName}_${timerName}`);
  }, [componentName]);

  const endTimer = useCallback((timerName: string, context?: Record<string, any>) => {
    return performanceMonitor.endTimer(`${componentName}_${timerName}`, {
      componentName,
      ...context
    });
  }, [componentName]);

  return {
    trackUserAction,
    trackAsyncOperation,
    startTimer,
    endTimer,
    renderCount: renderCountRef.current
  };
}

/**
 * Hook for tracking form performance
 */
export function useFormPerformance(formName: string) {
  const startTimeRef = useRef<number>(Date.now());
  const { trackUserAction, trackAsyncOperation } = usePerformance(`form_${formName}`);

  const trackFieldInteraction = useCallback((fieldName: string, action: 'focus' | 'blur' | 'change') => {
    trackUserAction(`field_${action}`, fieldName);
  }, [trackUserAction]);

  const trackFormSubmission = useCallback(async <T>(
    submitFn: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> => {
    const fillTime = Date.now() - startTimeRef.current;

    return trackAsyncOperation('submit', submitFn, {
      formFillTime: fillTime,
      ...context
    });
  }, [trackAsyncOperation]);

  const trackValidationError = useCallback((fieldName: string, errorType: string) => {
    trackUserAction('validation_error', fieldName, { errorType });
  }, [trackUserAction]);

  return {
    trackFieldInteraction,
    trackFormSubmission,
    trackValidationError,
    trackUserAction
  };
}

/**
 * Hook for tracking data table performance
 */
export function useTablePerformance(tableName: string) {
  const { trackUserAction, trackAsyncOperation, startTimer, endTimer } = usePerformance(`table_${tableName}`);

  const trackTableAction = useCallback((action: string, rowCount?: number, filters?: any) => {
    trackUserAction(action, undefined, { rowCount, filters });
  }, [trackUserAction]);

  const trackSort = useCallback((column: string, direction: 'asc' | 'desc') => {
    trackTableAction('sort', undefined, { column, direction });
  }, [trackTableAction]);

  const trackFilter = useCallback((filters: Record<string, any>) => {
    trackTableAction('filter', undefined, { filters });
  }, [trackTableAction]);

  const trackPagination = useCallback((page: number, pageSize: number, totalRows: number) => {
    trackTableAction('paginate', totalRows, { page, pageSize });
  }, [trackTableAction]);

  const trackDataLoad = useCallback(async <T>(
    loadFn: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> => {
    return trackAsyncOperation('data_load', loadFn, context);
  }, [trackAsyncOperation]);

  return {
    trackSort,
    trackFilter,
    trackPagination,
    trackDataLoad,
    trackTableAction,
    startTimer,
    endTimer
  };
}

/**
 * Hook for tracking Web Vitals using the web-vitals library
 * Note: Requires web-vitals package to be installed
 */
export function useWebVitals() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // This would integrate with the web-vitals library if installed
    // For now, we'll use a simplified version with Performance Observer

    try {
      // Track Largest Contentful Paint (LCP)
      if ('PerformanceObserver' in window) {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            performanceMonitor.trackWebVitals({
              name: 'LCP',
              value: lastEntry.startTime,
              rating: lastEntry.startTime <= 2500 ? 'good' : lastEntry.startTime <= 4000 ? 'needs-improvement' : 'poor',
              delta: lastEntry.startTime,
              id: 'lcp-' + Math.random().toString(36).substr(2, 9)
            });
          }
        });

        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // Track First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            performanceMonitor.trackWebVitals({
              name: 'FID',
              value: entry.processingStart - entry.startTime,
              rating: entry.processingStart - entry.startTime <= 100 ? 'good' :
                     entry.processingStart - entry.startTime <= 300 ? 'needs-improvement' : 'poor',
              delta: entry.processingStart - entry.startTime,
              id: 'fid-' + Math.random().toString(36).substr(2, 9)
            });
          });
        });

        fidObserver.observe({ entryTypes: ['first-input'] });

        return () => {
          lcpObserver.disconnect();
          fidObserver.disconnect();
        };
      }
    } catch (error) {
      console.warn('Web Vitals tracking failed:', error);
    }
  }, []);
}