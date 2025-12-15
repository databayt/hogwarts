/**
 * Auth Configuration Validator
 *
 * Validates all authentication environment variables at startup.
 * This helps catch configuration issues early before they cause OAuth failures.
 *
 * Usage:
 *   import { validateAuthConfig } from '@/lib/auth-config-validator'
 *   const result = validateAuthConfig()
 *   if (!result.valid) { ... handle issues ... }
 */

import { authLogger } from "./auth-logger"

export interface AuthConfigValidation {
  valid: boolean
  issues: string[]
  warnings: string[]
  config: {
    hasAuthSecret: boolean
    authSecretLength: number
    hasGoogleOAuth: boolean
    hasFacebookOAuth: boolean
    hasNextAuthUrl: boolean
    hasPrismaDatabase: boolean
    environment: string
  }
}

/**
 * Validates all auth configuration at startup
 */
export function validateAuthConfig(): AuthConfigValidation {
  authLogger.config("check", { step: "Starting auth configuration validation" })

  const issues: string[] = []
  const warnings: string[] = []

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTH_SECRET Validation
  // ═══════════════════════════════════════════════════════════════════════════
  const authSecret = process.env.AUTH_SECRET
  const hasAuthSecret = !!authSecret
  const authSecretLength = authSecret?.length || 0

  if (!authSecret) {
    issues.push("AUTH_SECRET is missing - OAuth will fail")
    authLogger.config("invalid", { field: "AUTH_SECRET", status: "MISSING" })
  } else if (authSecret.length < 32) {
    issues.push(
      `AUTH_SECRET is too short (${authSecret.length} chars, need 32+)`
    )
    authLogger.config("invalid", {
      field: "AUTH_SECRET",
      status: "TOO_SHORT",
      length: authSecret.length,
      required: 32,
    })
  } else {
    authLogger.config("valid", {
      field: "AUTH_SECRET",
      length: authSecret.length,
    })
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Google OAuth Validation
  // ═══════════════════════════════════════════════════════════════════════════
  const googleId = process.env.GOOGLE_CLIENT_ID
  const googleSecret = process.env.GOOGLE_CLIENT_SECRET
  const hasGoogleOAuth = !!googleId && !!googleSecret

  if (!googleId && !googleSecret) {
    warnings.push("Google OAuth not configured (both ID and SECRET missing)")
    authLogger.config("check", {
      field: "GOOGLE_OAUTH",
      status: "NOT_CONFIGURED",
    })
  } else if (!googleId || !googleSecret) {
    issues.push("Google OAuth partially configured - will fail")
    authLogger.config("invalid", {
      field: "GOOGLE_OAUTH",
      GOOGLE_CLIENT_ID: googleId ? "SET" : "MISSING",
      GOOGLE_CLIENT_SECRET: googleSecret ? "SET" : "MISSING",
    })
  } else {
    // Validate Google Client ID format (should end with .apps.googleusercontent.com)
    if (!googleId.includes(".apps.googleusercontent.com")) {
      warnings.push("Google Client ID format looks unusual")
      authLogger.config("check", {
        field: "GOOGLE_OAUTH",
        warning: "Client ID format unusual",
        idPrefix: googleId.substring(0, 15) + "...",
      })
    } else {
      authLogger.config("valid", {
        field: "GOOGLE_OAUTH",
        clientIdPrefix: googleId.substring(0, 20) + "...",
      })
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Facebook OAuth Validation
  // ═══════════════════════════════════════════════════════════════════════════
  const fbId = process.env.FACEBOOK_CLIENT_ID
  const fbSecret = process.env.FACEBOOK_CLIENT_SECRET
  const hasFacebookOAuth = !!fbId && !!fbSecret

  if (!fbId && !fbSecret) {
    warnings.push("Facebook OAuth not configured (both ID and SECRET missing)")
    authLogger.config("check", {
      field: "FACEBOOK_OAUTH",
      status: "NOT_CONFIGURED",
    })
  } else if (!fbId || !fbSecret) {
    issues.push("Facebook OAuth partially configured - will fail")
    authLogger.config("invalid", {
      field: "FACEBOOK_OAUTH",
      FACEBOOK_CLIENT_ID: fbId ? "SET" : "MISSING",
      FACEBOOK_CLIENT_SECRET: fbSecret ? "SET" : "MISSING",
    })
  } else {
    // Facebook App IDs are typically numeric
    if (!/^\d+$/.test(fbId)) {
      warnings.push("Facebook App ID format looks unusual (should be numeric)")
      authLogger.config("check", {
        field: "FACEBOOK_OAUTH",
        warning: "App ID format unusual",
        appId: fbId,
      })
    } else {
      authLogger.config("valid", {
        field: "FACEBOOK_OAUTH",
        appId: fbId,
      })
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NEXTAUTH_URL Validation
  // ═══════════════════════════════════════════════════════════════════════════
  const nextauthUrl = process.env.NEXTAUTH_URL
  const hasNextAuthUrl = !!nextauthUrl

  if (nextauthUrl) {
    // Validate URL format
    try {
      const url = new URL(nextauthUrl)
      if (!url.protocol.startsWith("http")) {
        warnings.push("NEXTAUTH_URL should use http or https protocol")
      }
      authLogger.config("valid", {
        field: "NEXTAUTH_URL",
        value: nextauthUrl,
        protocol: url.protocol,
        host: url.host,
      })
    } catch {
      issues.push(`NEXTAUTH_URL is not a valid URL: ${nextauthUrl}`)
      authLogger.config("invalid", {
        field: "NEXTAUTH_URL",
        value: nextauthUrl,
        error: "Invalid URL format",
      })
    }
  } else {
    // Not an error in v5 - can be inferred
    authLogger.config("check", {
      field: "NEXTAUTH_URL",
      status: "NOT_SET (will be inferred from request)",
    })
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Database URL Validation
  // ═══════════════════════════════════════════════════════════════════════════
  const databaseUrl = process.env.DATABASE_URL
  const hasPrismaDatabase = !!databaseUrl

  if (!databaseUrl) {
    issues.push("DATABASE_URL is missing - Prisma adapter will fail")
    authLogger.config("invalid", { field: "DATABASE_URL", status: "MISSING" })
  } else {
    // Check for common database URL formats
    const isPostgres = databaseUrl.startsWith("postgres")
    const isMySQL = databaseUrl.startsWith("mysql")
    const isSQLite = databaseUrl.startsWith("file:")

    authLogger.config("valid", {
      field: "DATABASE_URL",
      type: isPostgres
        ? "PostgreSQL"
        : isMySQL
          ? "MySQL"
          : isSQLite
            ? "SQLite"
            : "Unknown",
      // Don't log the full URL for security
      host: databaseUrl.includes("@")
        ? databaseUrl.split("@")[1]?.split("/")[0]
        : "local",
    })
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Environment Check
  // ═══════════════════════════════════════════════════════════════════════════
  const environment = process.env.NODE_ENV || "development"

  if (environment === "production") {
    // Production-specific checks
    if (!hasAuthSecret || authSecretLength < 32) {
      issues.push("PRODUCTION: AUTH_SECRET must be at least 32 characters")
    }

    if (!hasNextAuthUrl) {
      warnings.push("PRODUCTION: NEXTAUTH_URL recommended for production")
    }

    // Check for secure cookies in production
    authLogger.config("check", {
      field: "PRODUCTION_MODE",
      checks: {
        authSecretValid: hasAuthSecret && authSecretLength >= 32,
        nextauthUrlSet: hasNextAuthUrl,
        databaseConfigured: hasPrismaDatabase,
      },
    })
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Summary
  // ═══════════════════════════════════════════════════════════════════════════
  const valid = issues.length === 0

  if (issues.length > 0) {
    authLogger.error("❌ Configuration validation FAILED", {
      issueCount: issues.length,
      issues,
      warnings,
    })
  } else if (warnings.length > 0) {
    authLogger.warn("⚠️ Configuration validation PASSED with warnings", {
      warningCount: warnings.length,
      warnings,
    })
  } else {
    authLogger.info("✅ Configuration validation PASSED", {
      environment,
      providers: {
        google: hasGoogleOAuth,
        facebook: hasFacebookOAuth,
        credentials: true,
      },
    })
  }

  return {
    valid,
    issues,
    warnings,
    config: {
      hasAuthSecret,
      authSecretLength,
      hasGoogleOAuth,
      hasFacebookOAuth,
      hasNextAuthUrl,
      hasPrismaDatabase,
      environment,
    },
  }
}

/**
 * Check if a specific OAuth provider is configured
 */
export function isProviderConfigured(
  provider: "google" | "facebook" | "credentials"
): boolean {
  switch (provider) {
    case "google":
      return (
        !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET
      )
    case "facebook":
      return (
        !!process.env.FACEBOOK_CLIENT_ID && !!process.env.FACEBOOK_CLIENT_SECRET
      )
    case "credentials":
      return true // Always available
    default:
      return false
  }
}

/**
 * Get a summary of auth configuration for debugging
 */
export function getAuthConfigSummary(): Record<string, unknown> {
  return {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    AUTH_SECRET: process.env.AUTH_SECRET
      ? `SET (${process.env.AUTH_SECRET.length} chars)`
      : "MISSING",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || "NOT_SET",
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "SET" : "MISSING",
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? "SET" : "MISSING",
    FACEBOOK_CLIENT_ID: process.env.FACEBOOK_CLIENT_ID || "MISSING",
    FACEBOOK_CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET
      ? "SET"
      : "MISSING",
    DATABASE_URL: process.env.DATABASE_URL ? "SET" : "MISSING",
  }
}
