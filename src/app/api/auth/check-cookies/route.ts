/**
 * Cookie Debugging API
 *
 * Development-only endpoint to inspect server-side cookies.
 *
 * USE CASES:
 * - Debug OAuth callback URL preservation
 * - Verify NextAuth session cookies exist
 * - Troubleshoot cross-subdomain cookie issues
 *
 * WHY THIS EXISTS:
 * - Browser DevTools show client-accessible cookies only
 * - httpOnly cookies are invisible to JavaScript
 * - This endpoint exposes server's cookie view
 *
 * SECURITY NOTE:
 * - Exposes cookie names/values (truncated)
 * - Should be disabled or protected in production
 * - Consider adding DEVELOPER role check
 *
 * FILTERED COOKIES:
 * - oauth_callback_intended: Our custom OAuth return URL
 * - next-auth.*: NextAuth session/csrf tokens
 * - auth.*: Legacy auth cookies
 *
 * @see /auth/store-callback/route.ts - Sets oauth_callback_intended
 */

import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  console.log("=====================================")
  console.log("🍪 CHECK-COOKIES API CALLED")
  console.log("=====================================")

  try {
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()

    console.log("📋 All server-side cookies:", {
      count: allCookies.length,
      cookies: allCookies.map((c) => ({
        name: c.name,
        value: c.value?.substring(0, 100),
      })),
    })

    // Check for specific OAuth-related cookies
    const oauthCallbackCookie = cookieStore.get("oauth_callback_intended")
    const authCookies = allCookies.filter(
      (c) =>
        c.name.includes("auth") ||
        c.name.includes("oauth") ||
        c.name.includes("callback") ||
        c.name.includes("next-auth")
    )

    const result = {
      timestamp: new Date().toISOString(),
      totalCookies: allCookies.length,
      oauthCallbackCookie: oauthCallbackCookie
        ? {
            exists: true,
            value: oauthCallbackCookie.value,
          }
        : {
            exists: false,
            value: null,
          },
      authRelatedCookies: authCookies.map((c) => ({
        name: c.name,
        valuePreview: c.value?.substring(0, 50) + "...",
      })),
      allCookieNames: allCookies.map((c) => c.name),
    }

    console.log("📊 Cookie check result:", result)
    console.log("=====================================\n")

    return NextResponse.json(result)
  } catch (error) {
    console.error("❌ Error checking cookies:", error)
    return NextResponse.json(
      {
        error: "Failed to check cookies",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
