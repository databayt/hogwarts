/**
 * OAuth Configuration Test API - Provider Status Check
 *
 * Verifies OAuth provider configuration without triggering actual OAuth flow.
 *
 * WHY THIS EXISTS:
 * - OAuth errors are cryptic ("Invalid redirect URI")
 * - Need to verify config before debugging complex flows
 * - Confirm callback URLs match provider console settings
 *
 * WHAT IT CHECKS:
 * - Facebook: CLIENT_ID and CLIENT_SECRET configured
 * - Google: CLIENT_ID and CLIENT_SECRET configured
 * - Callback URL construction (based on NEXTAUTH_URL)
 *
 * WHY NOT EXPOSE ACTUAL VALUES:
 * - CLIENT_SECRET is sensitive (compromises OAuth)
 * - Only show boolean "configured" status
 * - Callback URLs are safe to show (needed for provider setup)
 *
 * CALLBACK URL FORMAT:
 * - {NEXTAUTH_URL}/api/auth/callback/{provider}
 * - Must exactly match provider console
 * - Common issue: trailing slash mismatch
 *
 * SECURITY:
 * - Protected by secureDebugEndpoint
 * - No secrets exposed
 * - Only shows configuration status
 *
 * USE CASE:
 * - Before debugging OAuth, verify env vars are set
 * - Copy callback URLs to provider console
 * - Confirm NEXTAUTH_URL matches current environment
 */

import { NextRequest } from "next/server"

import {
  createDebugResponse,
  getSafeEnvVars,
  secureDebugEndpoint,
} from "@/lib/debug-security"

export async function GET(request: NextRequest) {
  return secureDebugEndpoint(request, async () => {
    try {
      // Use safe environment variables
      const envCheck = getSafeEnvVars()

      // Only show OAuth URLs are configured, not the actual URLs with secrets
      const oauthStatus = {
        facebook: {
          clientIdConfigured: !!process.env.FACEBOOK_CLIENT_ID,
          clientSecretConfigured: !!process.env.FACEBOOK_CLIENT_SECRET,
          callbackUrl: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/auth/callback/facebook`,
        },
        google: {
          clientIdConfigured: !!process.env.GOOGLE_CLIENT_ID,
          clientSecretConfigured: !!process.env.GOOGLE_CLIENT_SECRET,
          callbackUrl: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/auth/callback/google`,
        },
      }

      return createDebugResponse({
        success: true,
        environment: envCheck,
        oauthStatus,
        message: "OAuth configuration test completed (secured)",
      })
    } catch (error) {
      console.error("OAuth test error:", error)
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
