/**
 * Auth Logger - Centralized logging for authentication debugging
 *
 * Log level behavior:
 * - error/warn/exception: Always logged (console.error/warn survive production stripping)
 * - info: Uses console.warn in production (survives stripping), console.log in dev
 * - debug/oauth/callback/session/api/redirect/cookies: Development only
 *
 * Production: next.config.ts strips console.log/debug, keeps console.error/warn
 */

const IS_DEV = process.env.NODE_ENV === "development"

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
   * Info logging - uses console.warn in production to survive stripping
   */
  info: (message: string, data?: AuthLogData) => {
    if (IS_DEV) {
      console.log(`[AUTH:INFO] ${message}${formatData(data)}`)
    } else {
      console.warn(`[AUTH:INFO] ${message}${formatData(data)}`)
    }
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
   * Debug logging - development only
   */
  debug: (message: string, data?: AuthLogData) => {
    if (IS_DEV) {
      console.log(`[AUTH:DEBUG] ${message}${formatData(data)}`)
    }
  },

  /**
   * OAuth-specific logging - development only
   */
  oauth: (provider: string, step: string, data?: AuthLogData) => {
    if (IS_DEV) {
      console.log(
        `[OAUTH:${provider.toUpperCase()}] ${step} @ ${timestamp()}${formatData(data)}`
      )
    }
  },

  /**
   * Callback tracking - development only
   */
  callback: (type: string, data?: AuthLogData) => {
    if (IS_DEV) {
      console.log(
        `[AUTH:CALLBACK:${type.toUpperCase()}] @ ${timestamp()}${formatData(data)}`
      )
    }
  },

  /**
   * Session-specific logging - development only
   */
  session: (action: string, data?: AuthLogData) => {
    if (IS_DEV) {
      console.log(`[AUTH:SESSION] ${action}${formatData(data)}`)
    }
  },

  /**
   * Configuration validation logging
   */
  config: (status: "valid" | "invalid" | "check", data?: AuthLogData) => {
    const prefix =
      status === "invalid" ? "❌" : status === "valid" ? "✅" : "🔍"
    if (status === "invalid") {
      console.error(`[AUTH:CONFIG] ${prefix}${formatData(data)}`)
    } else if (IS_DEV) {
      console.log(`[AUTH:CONFIG] ${prefix}${formatData(data)}`)
    }
  },

  /**
   * API request logging - development only
   */
  api: (method: string, url: string, data?: AuthLogData) => {
    if (IS_DEV) {
      console.log(
        `[AUTH:API] ${method} ${url} @ ${timestamp()}${formatData(data)}`
      )
    }
  },

  /**
   * Exception logging with full stack trace - always enabled
   */
  exception: (message: string, error: unknown) => {
    console.error(`[AUTH:EXCEPTION] ${message}`)
    if (error instanceof Error) {
      console.error(`  Name: ${error.name}`)
      console.error(`  Message: ${error.message}`)
      if (error.stack) {
        console.error(`  Stack: ${error.stack}`)
      }
      if (error.cause) {
        console.error(`  Cause: ${JSON.stringify(error.cause)}`)
      }
    } else {
      console.error(`  Error: ${JSON.stringify(error)}`)
    }
  },

  /**
   * Redirect tracking - development only
   */
  redirect: (from: string, to: string, reason: string, data?: AuthLogData) => {
    if (IS_DEV) {
      console.log(
        `[AUTH:REDIRECT] ${from} → ${to} (${reason}) @ ${timestamp()}${formatData(data)}`
      )
    }
  },

  /**
   * Cookie logging (sanitized) - development only
   */
  cookies: (action: string, cookies: { name: string; hasValue: boolean }[]) => {
    if (IS_DEV) {
      console.log(`[AUTH:COOKIES] ${action}`, {
        count: cookies.length,
        cookies: cookies.map(
          (c) => `${c.name}: ${c.hasValue ? "SET" : "EMPTY"}`
        ),
      })
    }
  },
}

// Initialization log - dev only
if (IS_DEV) {
  try {
    authLogger.info("Auth logger initialized", {
      environment: process.env.NODE_ENV,
      timestamp: timestamp(),
    })
  } catch {
    // Silently ignore initialization logging errors
  }
}
