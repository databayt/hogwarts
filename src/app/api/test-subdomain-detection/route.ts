/**
 * Subdomain Detection Test API - Algorithm Verification
 *
 * Replicates middleware subdomain extraction logic for isolated testing.
 *
 * WHY THIS EXISTS:
 * - Middleware runs in Edge Runtime (hard to debug)
 * - This replicates the exact algorithm in Node.js
 * - Allows testing without full request flow
 *
 * ALGORITHM DOCUMENTATION:
 *
 * 1. LOCAL DEVELOPMENT (localhost/127.0.0.1):
 *    - Pattern: http://tenant.localhost:3000
 *    - Extract: first part before .localhost
 *    - Example: school.localhost → "school"
 *
 * 2. PRODUCTION (ed.databayt.org structure):
 *    - Main app: ed.databayt.org → null (no subdomain)
 *    - Schools: school.databayt.org → "school"
 *    - Note: ed.databayt.org is special (school-dashboard root)
 *
 * 3. OTHER DOMAINS (configurable root):
 *    - Uses NEXT_PUBLIC_ROOT_DOMAIN
 *    - Checks hostname ends with .${rootDomain}
 *    - Excludes www.${rootDomain}
 *
 * WHY "ed.databayt.org" SPECIAL CASE:
 * - Platform lives at ed.databayt.org (not schools.databayt.org)
 * - school.databayt.org is a tenant subdomain
 * - ed.databayt.org itself is NOT a tenant
 *
 * RESPONSE INCLUDES:
 * - Detected subdomain (or null)
 * - Detection steps for debugging
 * - Environment context
 *
 * SECURITY:
 * - Protected by secureDebugEndpoint
 * - Root domain value hidden (shows [CONFIGURED])
 * - Query params stripped from logged URL
 */

import { NextRequest } from "next/server"

import {
  createDebugResponse,
  getSafeEnvVars,
  secureDebugEndpoint,
} from "@/lib/debug-security"

/**
 * Extract subdomain from request using middleware-equivalent logic.
 *
 * WHY DUPLICATE MIDDLEWARE LOGIC:
 * - Middleware runs in Edge Runtime (limited debugging)
 * - This function replicates logic for testing
 * - Allows isolated verification without full request flow
 */
function extractSubdomain(request: NextRequest): string | null {
  const url = request.url
  const host = request.headers.get("host") || ""
  const hostname = host.split(":")[0]
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000"

  console.log("🔍 TEST ENDPOINT - Subdomain extraction (AUTHORIZED):", {
    url: url.split("?")[0], // Remove query params for security
    host,
    hostname,
    rootDomain: rootDomain ? "[CONFIGURED]" : "[NOT_SET]",
    environment: process.env.NODE_ENV,
  })

  // Local development environment
  if (url.includes("localhost") || url.includes("127.0.0.1")) {
    if (hostname.includes(".localhost")) {
      const subdomain = hostname.split(".")[0]
      return subdomain
    }
    return null
  }

  // Production environment
  const rootDomainFormatted = rootDomain.split(":")[0]

  // Special handling for ed.databayt.org domain structure
  if (rootDomainFormatted === "ed.databayt.org") {
    // Check if hostname is the main domain
    if (hostname === "ed.databayt.org" || hostname === "www.ed.databayt.org") {
      return null
    }

    // Check if it's a school subdomain (*.databayt.org but not ed.databayt.org)
    if (hostname.endsWith(".databayt.org") && hostname !== "ed.databayt.org") {
      const subdomain = hostname.replace(".databayt.org", "")
      return subdomain
    }
  } else {
    // Regular subdomain detection for other domains
    const isSubdomain =
      hostname !== rootDomainFormatted &&
      hostname !== `www.${rootDomainFormatted}` &&
      hostname.endsWith(`.${rootDomainFormatted}`)

    if (isSubdomain) {
      const subdomain = hostname.replace(`.${rootDomainFormatted}`, "")
      return subdomain
    }
  }

  return null
}

export async function GET(request: NextRequest) {
  return secureDebugEndpoint(request, async () => {
    const host = request.headers.get("host") || "unknown"
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN
    const subdomain = extractSubdomain(request)

    return createDebugResponse({
      success: true,
      host,
      rootDomain: rootDomain ? "[CONFIGURED]" : "[NOT_SET]",
      subdomain,
      subdomainDetection: {
        hostEndsWithRoot: rootDomain ? host?.endsWith("." + rootDomain) : false,
        dotRootDomain: rootDomain ? "[CONFIGURED]" : null,
        subdomainEndIndex: rootDomain ? host.lastIndexOf("." + rootDomain) : -1,
        extractedSubdomain: subdomain,
      },
      environment: getSafeEnvVars(),
      message: "Subdomain detection test (secured) - using middleware logic",
    })
  })
}
