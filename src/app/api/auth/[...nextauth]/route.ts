/**
 * NextAuth Route Handler - OAuth Entry Point
 *
 * Exports NextAuth HTTP handlers for authentication flows with logging.
 *
 * WHY RE-EXPORT FROM @/auth:
 * - NextAuth v5 pattern: handlers defined once, exported here
 * - Main auth logic in src/auth.ts (callbacks, providers)
 * - This file just exposes GET/POST to the route with logging wrapper
 *
 * ROUTES HANDLED:
 * - GET /api/auth/signin - Sign-in page
 * - GET /api/auth/signout - Sign-out page
 * - GET /api/auth/callback/:provider - OAuth callbacks
 * - GET /api/auth/session - Session endpoint
 * - POST /api/auth/signin/:provider - Initiate OAuth
 * - POST /api/auth/signout - Process sign-out
 * - POST /api/auth/callback/credentials - Credentials auth
 *
 * WHY [...nextauth] CATCH-ALL:
 * - Single route handles all auth paths
 * - NextAuth routes internally by path segment
 * - Simplifies routing configuration
 *
 * @see src/auth.ts for full authentication configuration
 * @see src/auth.config.ts for callbacks and session handling
 */

import { NextRequest } from "next/server"
import { GET as AuthGET, POST as AuthPOST } from "@/auth"

import { authLogger } from "@/lib/auth-logger"

/**
 * Extract the auth action from the URL path
 * e.g., /api/auth/callback/google -> callback/google
 */
function extractAuthAction(url: string): string {
  try {
    const urlObj = new URL(url)
    const path = urlObj.pathname
    const match = path.match(/\/api\/auth\/(.+)/)
    return match ? match[1] : "unknown"
  } catch {
    return "unknown"
  }
}

/**
 * GET Handler with Logging
 * Handles: signin, signout, callback, session, csrf, providers
 */
export async function GET(request: NextRequest) {
  const action = extractAuthAction(request.url)

  authLogger.api("GET", request.url, {
    action,
    headers: {
      host: request.headers.get("host"),
      referer: request.headers.get("referer"),
      userAgent: request.headers.get("user-agent")?.substring(0, 50),
    },
  })

  try {
    const response = await AuthGET(request)

    // Log response status for debugging
    if (response) {
      authLogger.debug("GET response", {
        action,
        status: response.status,
        statusText: response.statusText,
        hasLocation: !!response.headers.get("location"),
        location: response.headers.get("location")?.substring(0, 100),
      })

      // Log redirects specifically (important for OAuth flow)
      if (response.status >= 300 && response.status < 400) {
        authLogger.redirect(
          action,
          response.headers.get("location") || "unknown",
          `HTTP ${response.status}`,
          { action }
        )
      }
    }

    return response
  } catch (error) {
    authLogger.exception(`GET ${action} failed`, error)
    throw error
  }
}

/**
 * POST Handler with Logging
 * Handles: signin (credentials/oauth), signout, callback
 */
export async function POST(request: NextRequest) {
  const action = extractAuthAction(request.url)

  authLogger.api("POST", request.url, {
    action,
    headers: {
      host: request.headers.get("host"),
      referer: request.headers.get("referer"),
      contentType: request.headers.get("content-type"),
    },
  })

  try {
    const response = await AuthPOST(request)

    // Log response status for debugging
    if (response) {
      authLogger.debug("POST response", {
        action,
        status: response.status,
        statusText: response.statusText,
        hasLocation: !!response.headers.get("location"),
      })

      // Log redirects specifically
      if (response.status >= 300 && response.status < 400) {
        authLogger.redirect(
          action,
          response.headers.get("location") || "unknown",
          `HTTP ${response.status}`,
          { action }
        )
      }
    }

    return response
  } catch (error) {
    authLogger.exception(`POST ${action} failed`, error)
    throw error
  }
}
