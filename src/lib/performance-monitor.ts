/**
 * Performance Monitoring & Observability Service
 *
 * PURPOSE: Tracks metrics for application performance analysis
 * Collects timings, API calls, database queries, and Web Vitals for diagnostics
 *
 * USE CASES:
 * - Monitor slow database queries (threshold: 1 second)
 * - Track page load performance (Navigation Timing API)
 * - Measure Web Vitals (LCP, FID, CLS)
 * - Alert on performance degradation
 *
 * KEY PATTERNS:
 * - startTimer/endTimer: Measure operation duration
 * - trackQuery/trackApiCall: Specialized wrappers with alerting
 * - trackPageLoad: Use Navigation Timing API for real load times
 * - trackWebVitals: Capture Google Web Vitals metrics
 *
 * THRESHOLDS (alert if exceeded):
 * - page_load: 3 seconds
 * - api_call: 5 seconds
 * - db_query: 1 second
 * - LCP: 2.5 seconds (Largest Contentful Paint)
 * - FID: 100 ms (First Input Delay)
 * - CLS: 0.1 (Cumulative Layout Shift)
 *
 * ARCHITECTURE:
 * - Singleton per session (one monitor per browser tab)
 * - Stores metrics in memory with TTL
 * - Automatic cleanup every 5 minutes (prevents memory leak)
 * - Max 5 minutes of historical data (300000 ms window)
 *
 * INTEGRATIONS:
 * - Sentry: Export metrics for error correlation
 * - Analytics: Track user experience metrics
 * - Logging: Alert on performance issues
 *
 * CONSTRAINTS & GOTCHAS:
 * - SSR incompatible (requires performance.now() and window)
 * - Metrics are in-memory only (lost on page reload)
 * - Network timing includes all redirects
 * - Web Vitals API not available in all browsers
 * - Auto-cleanup runs on interval (can't be cancelled manually)
 */

import { logger } from "./logger"

interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: string
  context?: Record<string, any>
}

interface WebVitalsData {
  name: string
  value: number
  rating: "good" | "needs-improvement" | "poor"
  delta: number
  id: string
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private startTimes = new Map<string, number>()

  /**
   * Start timing an operation
   */
  startTimer(name: string): void {
    this.startTimes.set(name, performance.now())
  }

  /**
   * End timing an operation and record the metric
   */
  endTimer(name: string, context?: Record<string, any>): number {
    const startTime = this.startTimes.get(name)
    if (!startTime) {
      logger.warn("Timer not found for operation", {
        action: "timer_not_found",
        name,
      })
      return 0
    }

    const duration = performance.now() - startTime
    this.recordMetric(name, duration, "ms", context)
    this.startTimes.delete(name)
    return duration
  }

  /**
   * Record a custom metric
   */
  recordMetric(
    name: string,
    value: number,
    unit: string = "ms",
    context?: Record<string, any>
  ): void {
    const metric: PerformanceMetric = {
      name,
      value: Math.round(value * 100) / 100, // Round to 2 decimal places
      unit,
      timestamp: new Date().toISOString(),
      context,
    }

    this.metrics.push(metric)

    // Log significant performance issues
    if (this.shouldAlertOnMetric(metric)) {
      logger.warn("Performance threshold exceeded", {
        action: "performance_alert",
        metric: metric.name,
        value: metric.value,
        unit: metric.unit,
        threshold: this.getThreshold(metric.name),
        ...context,
      })
    }

    // Log all metrics in development
    if (process.env.NODE_ENV === "development") {
      logger.debug(`Performance: ${name}`, {
        action: "performance_metric",
        value: metric.value,
        unit: metric.unit,
        ...context,
      })
    }
  }

  /**
   * Track database query performance
   */
  async trackQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    this.startTimer(`db_query_${queryName}`)
    try {
      const result = await queryFn()
      const duration = this.endTimer(`db_query_${queryName}`, {
        type: "database_query",
        queryName,
        ...context,
      })

      // Track slow queries
      if (duration > 1000) {
        // Over 1 second
        logger.warn("Slow database query detected", {
          action: "slow_query",
          queryName,
          duration,
          ...context,
        })
      }

      return result
    } catch (error) {
      this.endTimer(`db_query_${queryName}`, {
        type: "database_query",
        queryName,
        error: true,
        ...context,
      })
      throw error
    }
  }

  /**
   * Track API endpoint performance
   */
  async trackApiCall<T>(
    endpoint: string,
    apiFn: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    this.startTimer(`api_${endpoint}`)
    const startTime = Date.now()

    try {
      const result = await apiFn()
      const duration = this.endTimer(`api_${endpoint}`, {
        type: "api_call",
        endpoint,
        success: true,
        ...context,
      })

      return result
    } catch (error) {
      const duration = Date.now() - startTime
      this.recordMetric(`api_${endpoint}`, duration, "ms", {
        type: "api_call",
        endpoint,
        success: false,
        error: true,
        ...context,
      })

      logger.error(
        "API call failed",
        error instanceof Error ? error : new Error("Unknown API error"),
        {
          action: "api_error",
          endpoint,
          duration,
          ...context,
        }
      )

      throw error
    }
  }

  /**
   * Track page load performance (client-side)
   */
  trackPageLoad(pageName: string): void {
    if (typeof window === "undefined") return

    try {
      // Use Navigation Timing API
      const navigation = performance.getEntriesByType(
        "navigation"
      )[0] as PerformanceNavigationTiming

      if (navigation) {
        this.recordMetric(
          `page_load_${pageName}`,
          navigation.loadEventEnd - navigation.fetchStart,
          "ms",
          {
            type: "page_load",
            pageName,
            domContentLoaded:
              navigation.domContentLoadedEventEnd - navigation.fetchStart,
            firstPaint: this.getFirstPaint(),
            firstContentfulPaint: this.getFirstContentfulPaint(),
          }
        )
      }
    } catch (error) {
      logger.error(
        "Failed to track page load performance",
        error instanceof Error ? error : new Error("Unknown page load error"),
        {
          action: "page_load_tracking_error",
          pageName,
        }
      )
    }
  }

  /**
   * Track Web Vitals (client-side)
   */
  trackWebVitals(vitalsData: WebVitalsData): void {
    this.recordMetric(`web_vital_${vitalsData.name}`, vitalsData.value, "ms", {
      type: "web_vital",
      rating: vitalsData.rating,
      delta: vitalsData.delta,
      id: vitalsData.id,
    })

    // Alert on poor Web Vitals
    if (vitalsData.rating === "poor") {
      logger.warn("Poor Web Vital detected", {
        action: "poor_web_vital",
        name: vitalsData.name,
        value: vitalsData.value,
        rating: vitalsData.rating,
      })
    }
  }

  /**
   * Get performance summary
   */
  getSummary(timeWindow: number = 300000): {
    // Default 5 minutes
    metrics: PerformanceMetric[]
    averages: Record<string, number>
    totals: Record<string, number>
  } {
    const cutoff = Date.now() - timeWindow
    const recentMetrics = this.metrics.filter(
      (m) => new Date(m.timestamp).getTime() > cutoff
    )

    const averages: Record<string, number> = {}
    const totals: Record<string, number> = {}

    // Calculate averages and totals
    const metricGroups = recentMetrics.reduce(
      (groups, metric) => {
        if (!groups[metric.name]) {
          groups[metric.name] = []
        }
        groups[metric.name].push(metric.value)
        return groups
      },
      {} as Record<string, number[]>
    )

    Object.entries(metricGroups).forEach(([name, values]) => {
      averages[name] = values.reduce((sum, val) => sum + val, 0) / values.length
      totals[name] = values.length
    })

    return { metrics: recentMetrics, averages, totals }
  }

  /**
   * Clear old metrics to prevent memory leaks
   */
  cleanup(maxAge: number = 3600000): void {
    // Default 1 hour
    const cutoff = Date.now() - maxAge
    this.metrics = this.metrics.filter(
      (m) => new Date(m.timestamp).getTime() > cutoff
    )
  }

  private shouldAlertOnMetric(metric: PerformanceMetric): boolean {
    const threshold = this.getThreshold(metric.name)
    return threshold > 0 && metric.value > threshold
  }

  private getThreshold(metricName: string): number {
    const thresholds: Record<string, number> = {
      page_load: 3000, // 3 seconds
      api_call: 5000, // 5 seconds
      db_query: 1000, // 1 second
      web_vital_LCP: 2500, // Largest Contentful Paint
      web_vital_FID: 100, // First Input Delay
      web_vital_CLS: 0.1, // Cumulative Layout Shift
    }

    // Check for exact match first
    if (thresholds[metricName]) {
      return thresholds[metricName]
    }

    // Check for pattern matches
    for (const [pattern, threshold] of Object.entries(thresholds)) {
      if (metricName.startsWith(pattern)) {
        return threshold
      }
    }

    return 0 // No threshold
  }

  private getFirstPaint(): number | undefined {
    if (typeof window === "undefined") return undefined
    const paintEntries = performance.getEntriesByType("paint")
    const firstPaint = paintEntries.find(
      (entry) => entry.name === "first-paint"
    )
    return firstPaint?.startTime
  }

  private getFirstContentfulPaint(): number | undefined {
    if (typeof window === "undefined") return undefined
    const paintEntries = performance.getEntriesByType("paint")
    const fcp = paintEntries.find(
      (entry) => entry.name === "first-contentful-paint"
    )
    return fcp?.startTime
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor()

// Utility functions for easy use
export const startTimer = (name: string) => performanceMonitor.startTimer(name)
export const endTimer = (name: string, context?: Record<string, any>) =>
  performanceMonitor.endTimer(name, context)
export const recordMetric = (
  name: string,
  value: number,
  unit?: string,
  context?: Record<string, any>
) => performanceMonitor.recordMetric(name, value, unit, context)
export const trackQuery = <T>(
  name: string,
  queryFn: () => Promise<T>,
  context?: Record<string, any>
) => performanceMonitor.trackQuery(name, queryFn, context)
export const trackApiCall = <T>(
  endpoint: string,
  apiFn: () => Promise<T>,
  context?: Record<string, any>
) => performanceMonitor.trackApiCall(endpoint, apiFn, context)

// Auto-cleanup every 5 minutes
if (typeof window !== "undefined") {
  setInterval(() => {
    performanceMonitor.cleanup()
  }, 300000)
}
