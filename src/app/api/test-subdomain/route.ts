/**
 * Subdomain Test API - Development Diagnostic
 *
 * Quick health check for subdomain detection in multi-tenant routing.
 *
 * WHY THIS EXISTS:
 * - Debugging subdomain rewriting without full middleware trace
 * - Vercel vs localhost subdomain format differences
 * - Verify x-subdomain header injection from middleware
 *
 * SECURITY MODEL:
 * - Protected by secureDebugEndpoint (DEVELOPER/PLATFORM_ADMIN only)
 * - Development use only (disable in production)
 * - Environment variables sanitized (no secrets exposed)
 *
 * SUBDOMAIN SOURCES (in order):
 * 1. x-subdomain header (set by middleware)
 * 2. Host header parsing (fallback)
 *
 * USE CASES:
 * - Verify school.localhost:3000 → x-subdomain: "school"
 * - Check Vercel preview: tenant---branch.vercel.app
 * - Confirm production: school.databayt.org
 *
 * RESPONSE INCLUDES:
 * - host: Raw Host header
 * - subdomain: Detected tenant slug
 * - rootDomain: Configured root domain
 * - env: Safe environment variables
 */

import { NextRequest } from 'next/server'
import { secureDebugEndpoint, createDebugResponse, getSafeEnvVars } from '@/lib/debug-security';

export async function GET(request: NextRequest) {
  return secureDebugEndpoint(request, async () => {
  const host = request.headers.get('host') || 'unknown'
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN
  const subdomain = request.headers.get('x-subdomain')
  
  return createDebugResponse({ 
    success: true,
    host,
    rootDomain,
    subdomain,
    message: "Subdomain test endpoint working (secured)",
    env: getSafeEnvVars()
  });
  });
}
