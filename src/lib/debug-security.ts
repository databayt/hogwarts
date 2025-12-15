import { NextRequest, NextResponse } from "next/server"

import { requireRole } from "@/lib/auth-security"
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit"

/**
 * Secure debug utilities for development and troubleshooting
 * Only DEVELOPER role users can access debug endpoints
 */

/**
 * Middleware to secure debug endpoints
 * Must be used on all debug/test API endpoints
 */
export async function secureDebugEndpoint(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Apply rate limiting for debug endpoints
    const rateLimitResponse = await rateLimit(
      request,
      RATE_LIMITS.DEBUG,
      "debug"
    )
    if (rateLimitResponse) {
      return rateLimitResponse as NextResponse
    }

    // Only DEVELOPER role can access debug endpoints
    await requireRole("DEVELOPER")

    // Add security headers to debug responses
    const response = await handler(request)

    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("X-Robots-Tag", "noindex, nofollow")
    response.headers.set("X-Debug-Endpoint", "true")

    return response
  } catch (error) {
    console.error("Debug endpoint access denied:", error)

    return NextResponse.json(
      {
        error: "Access denied. DEVELOPER role required.",
        timestamp: new Date().toISOString(),
      },
      {
        status: 403,
        headers: {
          "Cache-Control": "no-store",
          "X-Robots-Tag": "noindex, nofollow",
        },
      }
    )
  }
}

/**
 * Create a secure debug response with standard security headers
 */
export function createDebugResponse(
  data: any,
  options?: ResponseInit
): NextResponse {
  const response = NextResponse.json(
    {
      ...data,
      timestamp: new Date().toISOString(),
      debugEndpoint: true,
      warning:
        "This endpoint contains sensitive information and should only be used by authorized developers.",
    },
    options
  )

  // Add security headers
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate")
  response.headers.set("Pragma", "no-cache")
  response.headers.set("X-Robots-Tag", "noindex, nofollow")
  response.headers.set("X-Debug-Endpoint", "true")

  return response
}

/**
 * Sanitize sensitive data for debug output
 */
export function sanitizeDebugData(data: any): any {
  if (typeof data === "string") {
    // Truncate long strings and mask sensitive tokens
    if (data.length > 50) {
      return data.slice(0, 20) + "...[TRUNCATED]..." + data.slice(-10)
    }
    return data
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeDebugData(item))
  }

  if (typeof data === "object" && data !== null) {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(data)) {
      // Mask sensitive fields
      if (
        key.toLowerCase().includes("secret") ||
        key.toLowerCase().includes("token") ||
        key.toLowerCase().includes("password") ||
        key.toLowerCase().includes("key")
      ) {
        sanitized[key] = value ? "[REDACTED]" : null
      } else {
        sanitized[key] = sanitizeDebugData(value)
      }
    }
    return sanitized
  }

  return data
}

/**
 * Get safe environment variables for debug display
 */
export function getSafeEnvVars(): Record<string, string | boolean> {
  return {
    NODE_ENV: process.env.NODE_ENV || "unknown",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || "not-set",
    NEXT_PUBLIC_ROOT_DOMAIN: process.env.NEXT_PUBLIC_ROOT_DOMAIN || "not-set",
    DATABASE_URL_SET: !!process.env.DATABASE_URL,
    AUTH_SECRET_SET: !!process.env.AUTH_SECRET,
    GOOGLE_CLIENT_ID_SET: !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET_SET: !!process.env.GOOGLE_CLIENT_SECRET,
    FACEBOOK_CLIENT_ID_SET: !!process.env.FACEBOOK_CLIENT_ID,
    FACEBOOK_CLIENT_SECRET_SET: !!process.env.FACEBOOK_CLIENT_SECRET,
  }
}
