/**
 * Subdomain Debug API - Detailed Extraction Analysis
 *
 * Shows step-by-step subdomain extraction for debugging routing issues.
 *
 * WHY THIS EXISTS:
 * - Middleware subdomain logic is complex (3 environments)
 * - Need to replicate logic in API for isolated testing
 * - Debug "wrong tenant" issues in production
 *
 * EXTRACTION LOGIC (MIRRORS MIDDLEWARE):
 * 1. Parse full URL and host header
 * 2. Check for localhost pattern: http://tenant.localhost
 * 3. Extract subdomain before .localhost
 *
 * WHY URL REGEX:
 * - Host header may not include port
 * - Full URL captures http://tenant.localhost:3000
 * - Regex groups extract tenant reliably
 *
 * SECURITY:
 * - Protected by secureDebugEndpoint
 * - Logs marked as AUTHORIZED (security audit trail)
 * - Only accessible to platform operators
 *
 * DEBUG OUTPUT:
 * - Full request details (url, host, pathname)
 * - Extracted subdomain (or null if none)
 * - User agent and referer for context
 * - Timestamp for correlation with logs
 */

import { NextRequest } from "next/server"

import { createDebugResponse, secureDebugEndpoint } from "@/lib/debug-security"

export async function GET(request: NextRequest) {
  return secureDebugEndpoint(request, async () => {
    try {
      const url = request.url
      const host = request.headers.get("host") || ""
      const hostname = host.split(":")[0]
      const pathname = new URL(url).pathname

      // Extract subdomain using the same logic as middleware
      let subdomain = null
      if (url.includes("localhost") || url.includes("127.0.0.1")) {
        const fullUrlMatch = url.match(/http:\/\/([^.]+)\.localhost/)
        if (fullUrlMatch && fullUrlMatch[1]) {
          subdomain = fullUrlMatch[1]
        } else if (hostname.includes(".localhost")) {
          subdomain = hostname.split(".")[0]
        }
      }

      const debugInfo = {
        url,
        host,
        hostname,
        pathname,
        subdomain,
        userAgent: request.headers.get("user-agent"),
        referer: request.headers.get("referer"),
        timestamp: new Date().toISOString(),
      }

      console.log("Debug subdomain info (AUTHORIZED):", debugInfo)

      return createDebugResponse({
        success: true,
        debugInfo,
        message: "Subdomain debug information",
      })
    } catch (error) {
      console.error("Subdomain debug error:", error)
      return createDebugResponse(
        {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      )
    }
  })
}
