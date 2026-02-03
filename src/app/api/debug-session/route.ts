/**
 * Session Debug API - Auth State Inspector
 *
 * Comprehensive debugging for NextAuth session and cookie state.
 *
 * WHY THIS EXISTS:
 * - OAuth flows across subdomains are notoriously hard to debug
 * - Cookie domain issues (subdomain vs root) cause silent failures
 * - PKCE state can get lost in cross-domain redirects
 * - Session exists in one context but not another
 *
 * WHAT IT INSPECTS:
 * 1. All cookies (total count + auth-specific)
 * 2. Specific auth cookies:
 *    - authjs.session-token: JWT session
 *    - authjs.pkce.code_verifier: OAuth PKCE protection
 *    - authjs.csrf-token: CSRF protection
 *    - authjs.callback-url: Post-login redirect
 * 3. Session state (from auth() call)
 * 4. Subdomain detection (3 environment types)
 * 5. Environment configuration
 *
 * SUBDOMAIN DETECTION TYPES:
 * - production: school.databayt.org
 * - development: school.localhost:3000
 * - vercel: tenant---branch.vercel.app
 *
 * WHY TRUNCATE COOKIE VALUES:
 * - JWTs are long (1000+ chars)
 * - First 20 chars enough to verify cookie exists
 * - Prevents log bloat and potential exposure
 *
 * SECURITY:
 * - Protected by secureDebugEndpoint
 * - Sensitive data sanitized before logging
 * - Only school-dashboard operators can access
 *
 * COMMON ISSUES DEBUGGED:
 * - Cookie not set on subdomain (domain config issue)
 * - Session null but cookie exists (JWT parsing failure)
 * - PKCE missing (cookie domain mismatch)
 */

import { NextRequest } from "next/server"
import { auth } from "@/auth"

import {
  createDebugResponse,
  sanitizeDebugData,
  secureDebugEndpoint,
} from "@/lib/debug-security"

export async function GET(request: NextRequest) {
  return secureDebugEndpoint(request, async () => {
    const host = request.headers.get("host") || ""
    const url = new URL(request.url)

    // Get all cookies from the request
    const allCookies = request.cookies.getAll()
    const authCookies = allCookies.filter(
      (cookie) =>
        cookie.name.startsWith("authjs.") ||
        cookie.name.includes("session") ||
        cookie.name.includes("auth")
    )

    // Get specific auth cookies
    const sessionToken = request.cookies.get("authjs.session-token")
    const pkceCodeVerifier = request.cookies.get("authjs.pkce.code_verifier")
    const csrfToken = request.cookies.get("authjs.csrf-token")
    const callbackUrl = request.cookies.get("authjs.callback-url")

    // Try to get the session
    let session = null
    let sessionError = null

    try {
      session = await auth()
    } catch (error) {
      sessionError = error instanceof Error ? error.message : String(error)
    }

    // Detect subdomain
    let subdomain = null
    let subdomainType = "none"

    if (host.endsWith(".databayt.org") && host !== "ed.databayt.org") {
      subdomain = host.split(".")[0]
      subdomainType = "production"
    } else if (
      host.includes(".localhost") &&
      host !== "localhost:3000" &&
      host !== "localhost"
    ) {
      subdomain = host.split(".")[0]
      subdomainType = "development"
    } else if (host.includes("---") && host.endsWith(".vercel.app")) {
      subdomain = host.split("---")[0]
      subdomainType = "vercel"
    }

    const debugInfo = {
      timestamp: new Date().toISOString(),
      request: {
        host,
        pathname: url.pathname,
        origin: url.origin,
        protocol: url.protocol,
      },
      subdomain: {
        detected: subdomain,
        type: subdomainType,
        isSubdomain: !!subdomain,
      },
      cookies: {
        total: allCookies.length,
        authCookies: authCookies.map((c) => ({
          name: c.name,
          value: c.value ? `${c.value.slice(0, 20)}...` : "undefined",
        })),
        specific: {
          sessionToken: sessionToken
            ? {
                name: sessionToken.name,
                value: sessionToken.value
                  ? `${sessionToken.value.slice(0, 20)}...`
                  : "undefined",
              }
            : null,
          pkceCodeVerifier: pkceCodeVerifier
            ? {
                name: pkceCodeVerifier.name,
                value: pkceCodeVerifier.value
                  ? `${pkceCodeVerifier.value.slice(0, 20)}...`
                  : "undefined",
              }
            : null,
          csrfToken: csrfToken
            ? {
                name: csrfToken.name,
                value: csrfToken.value
                  ? `${csrfToken.value.slice(0, 20)}...`
                  : "undefined",
              }
            : null,
          callbackUrl: callbackUrl
            ? {
                name: callbackUrl.name,
                value: callbackUrl.value || "undefined",
              }
            : null,
        },
      },
      session: {
        exists: !!session,
        userId: session?.user?.id || null,
        email: session?.user?.email || null,
        role: session?.user?.role || null,
        schoolId: session?.user?.schoolId || null,
        error: sessionError,
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        AUTH_SECRET: process.env.AUTH_SECRET ? "SET" : "NOT_SET",
      },
      headers: {
        cookie: request.headers.get("cookie") ? "PRESENT" : "MISSING",
        authorization: request.headers.get("authorization")
          ? "PRESENT"
          : "MISSING",
      },
    }

    // Sanitize sensitive data before logging
    const sanitizedInfo = sanitizeDebugData(debugInfo)
    console.log("🔍 SESSION DEBUG API CALLED (AUTHORIZED):", {
      host,
      subdomain,
      sessionExists: !!session,
      cookieCount: allCookies.length,
      authCookieCount: authCookies.length,
    })

    return createDebugResponse(sanitizedInfo)
  })
}
