/**
 * Auth Debug Endpoint
 *
 * Provides a JSON endpoint to check authentication configuration and state.
 * Useful for debugging OAuth issues without looking at server logs.
 *
 * SECURITY: This endpoint exposes configuration status (not secrets).
 * Consider adding authentication or removing in production if not needed.
 *
 * Usage:
 *   curl https://ed.databayt.org/api/auth/debug
 *   curl http://localhost:3000/api/auth/debug
 */

import { cookies } from "next/headers"
import { auth } from "@/auth"

import {
  getAuthConfigSummary,
  validateAuthConfig,
} from "@/lib/auth-config-validator"
import { authLogger } from "@/lib/auth-logger"

export const dynamic = "force-dynamic"

export async function GET() {
  authLogger.api("GET", "/api/auth/debug", { action: "debug" })

  try {
    // Get current session
    const session = await auth()

    // Get cookies (sanitized - names only, not values)
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    const authCookies = allCookies.filter(
      (c) =>
        c.name.includes("auth") ||
        c.name.includes("oauth") ||
        c.name.includes("next-auth") ||
        c.name.includes("session") ||
        c.name.includes("csrf") ||
        c.name.includes("callback")
    )

    // Validate configuration
    const configValidation = validateAuthConfig()
    const configSummary = getAuthConfigSummary()

    // Build response
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,

      // Session info (if authenticated)
      session: session
        ? {
            authenticated: true,
            userId: session.user?.id,
            email: session.user?.email,
            name: session.user?.name,
            role: (session.user as any)?.role,
            schoolId: (session.user as any)?.schoolId,
            isPreviewMode: (session.user as any)?.isPreviewMode,
          }
        : {
            authenticated: false,
          },

      // Configuration validation
      config: {
        valid: configValidation.valid,
        issues: configValidation.issues,
        warnings: configValidation.warnings,
        summary: configSummary,
      },

      // Auth cookies (names only for security)
      cookies: {
        total: allCookies.length,
        authRelated: authCookies.length,
        list: authCookies.map((c) => ({
          name: c.name,
          hasValue: !!c.value,
          valueLength: c.value?.length || 0,
        })),
      },

      // Provider status
      providers: {
        google: {
          configured:
            !!process.env.GOOGLE_CLIENT_ID &&
            !!process.env.GOOGLE_CLIENT_SECRET,
          clientIdSet: !!process.env.GOOGLE_CLIENT_ID,
          clientSecretSet: !!process.env.GOOGLE_CLIENT_SECRET,
        },
        facebook: {
          configured:
            !!process.env.FACEBOOK_CLIENT_ID &&
            !!process.env.FACEBOOK_CLIENT_SECRET,
          clientIdSet: !!process.env.FACEBOOK_CLIENT_ID,
          clientSecretSet: !!process.env.FACEBOOK_CLIENT_SECRET,
          appId: process.env.FACEBOOK_CLIENT_ID || null,
        },
        credentials: {
          configured: true,
        },
      },

      // URLs
      urls: {
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || "NOT_SET (inferred)",
        callbackBase:
          process.env.NEXTAUTH_URL || "https://ed.databayt.org/api/auth",
        googleCallback: `${process.env.NEXTAUTH_URL || "https://ed.databayt.org"}/api/auth/callback/google`,
        facebookCallback: `${process.env.NEXTAUTH_URL || "https://ed.databayt.org"}/api/auth/callback/facebook`,
      },

      // Debugging hints
      hints: [] as string[],
    }

    // Add debugging hints based on issues
    if (!configValidation.valid) {
      debugInfo.hints.push(
        "Configuration issues detected - check 'config.issues' for details"
      )
    }

    if (!debugInfo.providers.google.configured) {
      debugInfo.hints.push(
        "Google OAuth not configured - set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET"
      )
    }

    if (!debugInfo.providers.facebook.configured) {
      debugInfo.hints.push(
        "Facebook OAuth not configured - set FACEBOOK_CLIENT_ID and FACEBOOK_CLIENT_SECRET"
      )
    }

    if (
      debugInfo.cookies.authRelated === 0 &&
      !debugInfo.session.authenticated
    ) {
      debugInfo.hints.push(
        "No auth cookies found - user has not attempted login or cookies were cleared"
      )
    }

    authLogger.info("Debug endpoint accessed", {
      sessionAuthenticated: !!session,
      configValid: configValidation.valid,
    })

    return Response.json(debugInfo, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    })
  } catch (error) {
    authLogger.exception("Debug endpoint error", error)

    return Response.json(
      {
        timestamp: new Date().toISOString(),
        error: "Failed to get debug info",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
