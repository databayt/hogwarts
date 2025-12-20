/**
 * Auth Logger - Centralized logging for authentication debugging
 *
 * This logger provides consistent, structured logging across all auth components.
 * Logs are ALWAYS enabled to ensure visibility of auth issues in production.
 *
 * Usage:
 *   import { authLogger } from '@/lib/auth-logger'
 *   authLogger.oauth('google', 'Profile received', { email: '...' })
 */

const AUTH_DEBUG = true // Force-enable for debugging - set to false after issue resolved

interface AuthLogData {
  [key: string]: unknown
}

const formatData = (data?: AuthLogData): string => {
  if (!data) return ""
  try {
    return "\n" + JSON.stringify(data, null, 2)
  } catch {
    return "\n[Unserializable data]"
  }
}

const timestamp = () => new Date().toISOString()

export const authLogger = {
  /**
   * General info logging - always enabled
   */
  info: (message: string, data?: AuthLogData) => {
    console.log(`[AUTH:INFO] ${message}${formatData(data)}`)
  },

  /**
   * Warning logging - always enabled
   */
  warn: (message: string, data?: AuthLogData) => {
    console.warn(`[AUTH:WARN] ${message}${formatData(data)}`)
  },

  /**
   * Error logging - always enabled
   */
  error: (message: string, data?: AuthLogData) => {
    console.error(`[AUTH:ERROR] ${message}${formatData(data)}`)
  },

  /**
   * Debug logging - controlled by AUTH_DEBUG flag
   */
  debug: (message: string, data?: AuthLogData) => {
    if (AUTH_DEBUG) {
      console.log(`[AUTH:DEBUG] ${message}${formatData(data)}`)
    }
  },

  /**
   * OAuth-specific logging with provider and step tracking
   */
  oauth: (provider: string, step: string, data?: AuthLogData) => {
    console.log(
      `[OAUTH:${provider.toUpperCase()}] ${step} @ ${timestamp()}${formatData(data)}`
    )
  },

  /**
   * Callback tracking for JWT, Session, SignIn, Redirect
   */
  callback: (type: string, data?: AuthLogData) => {
    console.log(
      `[AUTH:CALLBACK:${type.toUpperCase()}] @ ${timestamp()}${formatData(data)}`
    )
  },

  /**
   * Session-specific logging
   */
  session: (action: string, data?: AuthLogData) => {
    console.log(`[AUTH:SESSION] ${action}${formatData(data)}`)
  },

  /**
   * Configuration validation logging with status indicators
   */
  config: (status: "valid" | "invalid" | "check", data?: AuthLogData) => {
    const prefix =
      status === "invalid" ? "❌" : status === "valid" ? "✅" : "🔍"
    console.log(`[AUTH:CONFIG] ${prefix}${formatData(data)}`)
  },

  /**
   * API request logging
   */
  api: (method: string, url: string, data?: AuthLogData) => {
    console.log(
      `[AUTH:API] ${method} ${url} @ ${timestamp()}${formatData(data)}`
    )
  },

  /**
   * Exception logging with full stack trace
   */
  exception: (message: string, error: unknown) => {
    console.error(`[AUTH:EXCEPTION] ${message}`)
    if (error instanceof Error) {
      console.error(`  Name: ${error.name}`)
      console.error(`  Message: ${error.message}`)
      if (error.stack) {
        console.error(`  Stack: ${error.stack}`)
      }
      // Log cause if present (for chained errors)
      if (error.cause) {
        console.error(`  Cause: ${JSON.stringify(error.cause)}`)
      }
    } else {
      console.error(`  Error: ${JSON.stringify(error)}`)
    }
  },

  /**
   * Redirect tracking for debugging OAuth flow
   */
  redirect: (from: string, to: string, reason: string, data?: AuthLogData) => {
    console.log(
      `[AUTH:REDIRECT] ${from} → ${to} (${reason}) @ ${timestamp()}${formatData(data)}`
    )
  },

  /**
   * Cookie logging (sanitized - no values)
   */
  cookies: (action: string, cookies: { name: string; hasValue: boolean }[]) => {
    console.log(`[AUTH:COOKIES] ${action}`, {
      count: cookies.length,
      cookies: cookies.map((c) => `${c.name}: ${c.hasValue ? "SET" : "EMPTY"}`),
    })
  },
}

// Log that the auth logger is initialized (wrapped to prevent module load failures)
try {
  authLogger.info("Auth logger initialized", {
    AUTH_DEBUG,
    environment: process.env.NODE_ENV,
    timestamp: timestamp(),
  })
} catch {
  // Silently ignore initialization logging errors
}
