/**
 * Production-Ready Logging Utility
 *
 * Provides environment-aware, structured logging for multi-tenant SaaS.
 *
 * ENVIRONMENT BEHAVIOR:
 *
 * | Level | Development | Production                      |
 * |-------|-------------|----------------------------------|
 * | debug | console.log | Silent (performance)             |
 * | info  | console.info| ENABLE_PRODUCTION_LOGS=true only |
 * | warn  | console.warn| console + Sentry/Vercel          |
 * | error | console.error| console + Sentry/Vercel         |
 *
 * WHY THIS STRATEGY:
 * - Development: Full visibility for debugging
 * - Production: Minimal console output, errors routed to external services
 *
 * MULTI-TENANT TRACEABILITY:
 * Every log entry includes:
 * - requestId: Traces request across services (req:abc12345)
 * - schoolId: Identifies tenant for filtering (school:school-123)
 * - userId: Identifies user (user:user-456)
 *
 * GOTCHA: env import removed
 * Server environment variables were accidentally exposed to client-side code.
 * Now uses process.env directly to prevent leakage.
 *
 * EXTERNAL INTEGRATIONS:
 * - Vercel Analytics: Automatic via structured JSON logging
 * - Sentry: Client-side via window.Sentry (SSR Sentry commented out)
 */

// Note: env import removed to prevent client-side access to server env vars

type LogLevel = "debug" | "info" | "warn" | "error"

interface LogContext {
  requestId?: string
  userId?: string
  schoolId?: string
  action?: string
  [key: string]: any
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development"
  private isProduction = process.env.NODE_ENV === "production"

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext
  ): string {
    const timestamp = new Date().toISOString()

    // Extract key fields for better readability
    const requestId = context?.requestId
      ? `[req:${context.requestId.slice(0, 8)}]`
      : ""
    const schoolId = context?.schoolId ? `[school:${context.schoolId}]` : ""
    const userId = context?.userId ? `[user:${context.userId}]` : ""

    // Format structured context without redundant fields
    const cleanContext = context ? { ...context } : {}
    delete cleanContext?.requestId
    delete cleanContext?.schoolId
    delete cleanContext?.userId

    const contextStr =
      Object.keys(cleanContext).length > 0 ? JSON.stringify(cleanContext) : ""

    return `[${timestamp}] [${level.toUpperCase()}] ${requestId}${schoolId}${userId} ${message} ${contextStr}`.trim()
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage("debug", message, context))
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.info(this.formatMessage("info", message, context))
    }
    // In production, you might want to send this to a logging service
    if (this.isProduction && process.env.ENABLE_PRODUCTION_LOGS === "true") {
      // Send to logging service (e.g., Sentry, LogRocket, etc.)
      this.sendToLoggingService("info", message, context)
    }
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage("warn", message, context))
    if (this.isProduction) {
      this.sendToLoggingService("warn", message, context)
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorDetails =
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: this.isDevelopment ? error.stack : undefined,
          }
        : error

    console.error(
      this.formatMessage("error", message, { ...context, error: errorDetails })
    )

    if (this.isProduction) {
      this.sendToLoggingService("error", message, {
        ...context,
        error: errorDetails,
      })
    }
  }

  private sendToLoggingService(
    level: LogLevel,
    message: string,
    context?: LogContext
  ): void {
    // WHY EXTERNAL LOGGING:
    // Production console.log is stripped by Next.js. External services
    // persist logs and provide search/alerting capabilities.

    // === VERCEL ANALYTICS INTEGRATION (Built-in) ===
    // WHY: Vercel automatically captures structured JSON logs
    // No SDK needed - just console.log with JSON format
    try {
      // Server-side only - client logs go through different path
      if (typeof window === "undefined") {
        // WHY JSON.stringify: Vercel parses JSON logs for structured filtering
        console[level](
          JSON.stringify({
            timestamp: new Date().toISOString(),
            level: level.toUpperCase(),
            message,
            requestId: context?.requestId,
            schoolId: context?.schoolId,
            userId: context?.userId,
            context: context
              ? Object.fromEntries(
                  Object.entries(context).filter(
                    ([key]) =>
                      !["requestId", "schoolId", "userId"].includes(key)
                  )
                )
              : undefined,
            service: "hogwarts-school-dashboard",
            environment: process.env.NODE_ENV,
          })
        )
      }
    } catch (error) {
      console.error("Failed to send log to Vercel Analytics:", error)
    }

    // === SENTRY INTEGRATION (Optional) ===
    // WHY CLIENT-ONLY:
    // Server-side Sentry (@sentry/node) requires dynamic require() which
    // breaks Edge Runtime compatibility. Client-side uses browser bundle.
    // Server errors are captured via Next.js error boundaries + instrumentation.
    if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
      try {
        // Client-side Sentry - uses global injected by Sentry script
        if (typeof window !== "undefined" && (window as any).Sentry) {
          const Sentry = (window as any).Sentry
          Sentry.withScope((scope: any) => {
            // Add context to Sentry scope
            if (context?.requestId) scope.setTag("requestId", context.requestId)
            if (context?.schoolId) scope.setTag("schoolId", context.schoolId)
            if (context?.userId) scope.setUser({ id: context.userId })

            if (level === "error") {
              if (context?.error instanceof Error) {
                Sentry.captureException(context.error)
              } else {
                Sentry.captureMessage(message, "error")
              }
            } else if (level === "warn") {
              Sentry.captureMessage(message, "warning")
            }
          })
        }

        // Server-side Sentry (would need @sentry/node)
        // if (typeof window === 'undefined' && typeof require !== 'undefined') {
        //   const Sentry = require('@sentry/node');
        //   Sentry.withScope((scope: any) => {
        //     if (context?.requestId) scope.setTag('requestId', context.requestId);
        //     if (context?.schoolId) scope.setTag('schoolId', context.schoolId);
        //     if (context?.userId) scope.setUser({ id: context.userId });
        //
        //     if (level === 'error') {
        //       if (context?.error instanceof Error) {
        //         Sentry.captureException(context.error);
        //       } else {
        //         Sentry.captureMessage(message, 'error');
        //       }
        //     } else if (level === 'warn') {
        //       Sentry.captureMessage(message, 'warning');
        //     }
        //   });
        // }
      } catch (error) {
        console.error("Failed to send log to Sentry:", error)
      }
    }
  }

  // Performance logging helper
  time(label: string): void {
    if (this.isDevelopment) {
      console.time(label)
    }
  }

  timeEnd(label: string): void {
    if (this.isDevelopment) {
      console.timeEnd(label)
    }
  }
}

// Utility functions

/**
 * Generate unique request ID for distributed tracing
 *
 * WHY crypto.randomUUID:
 * - Edge Runtime compatible (unlike node:crypto)
 * - Standard UUID format works with tracing tools
 * - No collision risk across distributed systems
 *
 * FALLBACK STRATEGY:
 * timestamp-random provides uniqueness but no standard format.
 * Used only when crypto.randomUUID unavailable (rare).
 */
export function generateRequestId(): string {
  // Prefer crypto.randomUUID (Edge Runtime compatible)
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback: timestamp + random (not UUID format but unique)
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Enhanced logger with request context helpers
class EnhancedLogger extends Logger {
  // Helper to create context from request headers (for middleware/API routes)
  createRequestContext(
    headers: Headers,
    schoolId?: string,
    userId?: string
  ): LogContext {
    const requestId = headers.get("x-request-id") || generateRequestId()
    return {
      requestId,
      schoolId,
      userId,
    }
  }

  // Helper for API routes to extract context from NextRequest
  contextFromRequest(
    request: Request,
    schoolId?: string,
    userId?: string
  ): LogContext {
    return this.createRequestContext(request.headers, schoolId, userId)
  }
}

// Export singleton instance
export const logger = new EnhancedLogger()

// Export type for use in other files
export type { LogContext }
