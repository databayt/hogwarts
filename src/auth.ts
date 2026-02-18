import { cookies } from "next/headers"
import { DEFAULT_LOGIN_REDIRECT } from "@/routes"
import NextAuth from "next-auth"
import { getToken } from "next-auth/jwt"

import { validateAuthConfig } from "@/lib/auth-config-validator"
import { authLogger } from "@/lib/auth-logger"
import { db } from "@/lib/db"
import { MultiTenantPrismaAdapter } from "@/lib/multi-tenant-prisma-adapter"

import authConfig from "./auth.config"

// ═══════════════════════════════════════════════════════════════════════════
// STARTUP VALIDATION - Catches config issues BEFORE OAuth fails
// Wrapped in try-catch to prevent module load failures in edge runtime
// ═══════════════════════════════════════════════════════════════════════════
try {
  const configValidation = validateAuthConfig()
  if (!configValidation.valid) {
    authLogger.error("🚨 AUTH CONFIG INVALID - OAuth will fail!", {
      issues: configValidation.issues,
      warnings: configValidation.warnings,
    })
  }
} catch (error) {
  // Silently handle validation errors to prevent module load failures
  // This ensures server actions can still be imported even if validation fails
  console.error("[AUTH] Config validation error (non-fatal):", error)
}

/**
 * Helper: Get school domain from database by schoolId
 * Returns null if schoolId is null/undefined or school not found
 */
async function getSchoolDomain(
  schoolId: string | null | undefined
): Promise<string | null> {
  if (!schoolId) return null

  try {
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { domain: true },
    })

    return school?.domain || null
  } catch (error) {
    console.error("Error fetching school domain:", error)
    return null
  }
}

/**
 * Helper: Construct environment-aware school URL
 * Development: http://{subdomain}.localhost:3000{path}
 * Production: https://{subdomain}.databayt.org{path}
 */
function constructSchoolUrl(
  subdomain: string,
  path: string = "/dashboard"
): string {
  const isDev = process.env.NODE_ENV === "development"

  if (isDev) {
    return `http://${subdomain}.localhost:3000${path}`
  } else {
    return `https://${subdomain}.databayt.org${path}`
  }
}

/**
 * Helper: Extract locale from URL (ar or en)
 * Returns 'ar' as default if not found
 */
function extractLocaleFromUrl(url: string): string {
  const match = url.match(/\/(ar|en)(\/|$|\?)/)
  return match ? match[1] : "ar" // Default to Arabic
}

// ═══════════════════════════════════════════════════════════════════════════
// REDIRECT HELPERS - Extracted from redirect callback for maintainability
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Resolve callback URL from multiple sources (first wins):
 * 0. Server-side cookie (oauth_callback_intended)
 * 1. URL searchParams (callbackUrl / redirect)
 * 2. URL regex match (callbackUrl=...)
 * 3. baseUrl searchParams
 */
async function resolveCallbackUrl(
  url: string,
  baseUrl: string
): Promise<string | null> {
  // Method 0: Server-side cookie (most reliable for OAuth flows)
  try {
    const cookieStore = await cookies()
    const stored = cookieStore.get("oauth_callback_intended")
    if (stored?.value) return stored.value
  } catch {
    // cookies() not available in this context
  }

  // Method 1: URL searchParams
  try {
    const urlObj = new URL(url, baseUrl)
    const fromParams =
      urlObj.searchParams.get("callbackUrl") ||
      urlObj.searchParams.get("redirect")
    if (fromParams) return fromParams
  } catch {
    // Invalid URL
  }

  // Method 2: Regex fallback
  if (url.includes("callbackUrl=")) {
    const match = url.match(/callbackUrl=([^&]+)/)
    if (match) return decodeURIComponent(match[1])
  }

  // Method 3: baseUrl searchParams (during OAuth flow)
  try {
    const baseUrlObj = new URL(baseUrl)
    const fromBase = baseUrlObj.searchParams.get("callbackUrl")
    if (fromBase) return fromBase
  } catch {
    // Invalid baseUrl
  }

  return null
}

/**
 * Validate callback URL for same-origin security.
 * Returns absolute URL if valid, null if rejected.
 */
function validateCallbackUrl(
  callbackUrl: string,
  baseUrl: string
): string | null {
  try {
    if (callbackUrl.startsWith("/")) {
      return `${baseUrl}${callbackUrl}`
    }
    const callbackOrigin = new URL(callbackUrl, baseUrl).origin
    const baseOrigin = new URL(baseUrl).origin
    if (callbackOrigin === baseOrigin) {
      return callbackUrl
    }
  } catch {
    // Parse error — try relative path as last resort
    if (callbackUrl.startsWith("/")) {
      return `${baseUrl}${callbackUrl}`
    }
  }
  return null
}

/** Extract host from url (full URL) or baseUrl (relative URL) */
function getHostFromUrl(url: string, baseUrl: string): string {
  try {
    if (url.startsWith("http")) return new URL(url).host
    return new URL(baseUrl).host
  } catch {
    try {
      return new URL(baseUrl).host
    } catch {
      return ""
    }
  }
}

/**
 * Detect subdomain from host.
 * Returns null for main domain (ed.databayt.org, localhost:3000).
 */
function detectSubdomainFromHost(host: string): string | null {
  // Production: school.databayt.org → "school" (exclude ed.databayt.org)
  if (host.endsWith(".databayt.org") && !host.startsWith("ed.")) {
    return host.split(".")[0]
  }
  // Development: school.localhost:3000 → "school"
  if (
    host.includes(".localhost") &&
    host !== "localhost:3000" &&
    host !== "localhost"
  ) {
    const sub = host.split(".")[0]
    if (sub !== "www" && sub !== "localhost") return sub
  }
  return null
}

/** Check if host is the main domain (not a tenant subdomain) */
function isMainDomain(host: string): boolean {
  return (
    host === "ed.databayt.org" ||
    host.includes("ed.databayt.org") ||
    host === "localhost:3000" ||
    host === "localhost"
  )
}

/** Extract tenant parameter from URL or baseUrl searchParams */
function extractTenantParam(url: string, baseUrl: string): string | null {
  try {
    const urlObj = new URL(url, baseUrl)
    const tenant = urlObj.searchParams.get("tenant")
    if (tenant) return tenant
  } catch {
    // Invalid URL
  }

  // Regex fallback for tenant=... in URL string
  const match = url.match(/tenant=([^&]+)/)
  if (match) return match[1]

  try {
    const baseUrlObj = new URL(baseUrl)
    return baseUrlObj.searchParams.get("tenant")
  } catch {
    return null
  }
}

/**
 * Smart redirect: decode JWT → look up user's school → redirect to school subdomain.
 * Returns null if unable to determine redirect (caller should use fallback).
 */
async function getSmartRedirectUrl(
  url: string,
  baseUrl: string
): Promise<string | null> {
  try {
    const token = await getToken({
      req: {
        headers: {
          cookie: (await cookies()).toString(),
        },
      } as any,
      secret: process.env.AUTH_SECRET,
    })

    if (!token) return null

    const userSchoolId = token.schoolId as string | null | undefined
    const userRole = token.role as string | undefined

    // DEVELOPER or no school → main dashboard
    if (!userSchoolId || userRole === "DEVELOPER") {
      return `${baseUrl}/dashboard`
    }

    // Regular user → look up school subdomain
    const schoolDomain = await getSchoolDomain(userSchoolId)
    if (schoolDomain) {
      const locale = extractLocaleFromUrl(url)
      return constructSchoolUrl(schoolDomain, `/${locale}/dashboard`)
    }

    // School not found — fall through
    return null
  } catch (error) {
    authLogger.error("Smart redirect failed", {
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: MultiTenantPrismaAdapter(db),
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: process.env.NODE_ENV === "production" ? 5 * 60 : 60 * 60, // 5 minutes in prod (for critical updates), 1 hour in dev
    generateSessionToken: () => {
      const bytes = new Uint8Array(32)
      crypto.getRandomValues(bytes)
      return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
    },
  },
  pages: {
    signIn: "/login",
    error: "/error",
  },
  secret: process.env.AUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  trustHost: true, // Required for OAuth in production (Vercel proxies)
  logger: {
    error(code, ...message: unknown[]) {
      // Extract all error details into a single object for Vercel logs
      const extractErrorDetails = (
        obj: unknown,
        depth = 0
      ): Record<string, unknown> => {
        if (depth > 5 || !obj || typeof obj !== "object") return {}
        const errObj = obj as Record<string, unknown>
        const details: Record<string, unknown> = {}

        if (errObj.type) details.type = errObj.type
        if (errObj.name) details.name = errObj.name
        if (errObj.message) details.message = errObj.message
        if (errObj.code) details.code = errObj.code
        if (errObj.meta) details.meta = errObj.meta

        if (errObj.cause && typeof errObj.cause === "object") {
          details.cause = extractErrorDetails(errObj.cause, depth + 1)
        }

        return details
      }

      const errorDetails = message[0] ? extractErrorDetails(message[0]) : {}
      console.error(
        "[AUTH ERROR DETAILED]",
        JSON.stringify({ code, ...errorDetails }, null, 2)
      )
    },
    warn(code, ...message: unknown[]) {
      console.warn("[AUTH WARN]", code, message)
    },
    debug(code, ...message: unknown[]) {
      console.log("[AUTH DEBUG]", code, message)
    },
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      if (process.env.NODE_ENV === "development") {
        console.log("🎉 SIGN IN EVENT:", {
          userId: user.id,
          email: user.email,
          provider: account?.provider,
          isNewUser,
          timestamp: new Date().toISOString(),
        })
      }
    },
    async signOut() {
      try {
        const cookieStore = await cookies()
        cookieStore.delete("impersonate_schoolId")
      } catch {
        // cookies() may not be available in all contexts
      }
    },
  },
  /**
   * Cookie Configuration for Multi-Tenant Cross-Subdomain Auth
   *
   * CRITICAL: domain: '.databayt.org' allows cookies to be shared across all subdomains
   * (school1.databayt.org, school2.databayt.org, ed.databayt.org)
   *
   * Without this, users would need to re-authenticate for each subdomain.
   * In development, domain is undefined (cookies only work on localhost).
   */
  cookies: {
    pkceCodeVerifier: {
      name: `authjs.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: "lax", // Required for OAuth redirects
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 900, // 15 minutes - OAuth flow timeout
        domain:
          process.env.NODE_ENV === "production" ? ".databayt.org" : undefined,
      },
    },
    sessionToken: {
      name: `authjs.session-token`,
      options: {
        httpOnly: true, // Prevents XSS access to session token
        sameSite: "lax", // Allows cross-subdomain cookies
        path: "/",
        secure: process.env.NODE_ENV === "production",
        domain:
          process.env.NODE_ENV === "production" ? ".databayt.org" : undefined,
        maxAge: 24 * 60 * 60, // 24 hours - matches session.maxAge
      },
    },
    callbackUrl: {
      name: `authjs.callback-url`,
      options: {
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        domain:
          process.env.NODE_ENV === "production" ? ".databayt.org" : undefined,
      },
    },
    csrfToken: {
      name: `authjs.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        domain:
          process.env.NODE_ENV === "production" ? ".databayt.org" : undefined,
      },
    },
    // Add explicit configuration for all NextAuth cookies
    state: {
      name: `authjs.state`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        domain:
          process.env.NODE_ENV === "production" ? ".databayt.org" : undefined,
      },
    },
    nonce: {
      name: `authjs.nonce`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        domain:
          process.env.NODE_ENV === "production" ? ".databayt.org" : undefined,
      },
    },
  },
  callbacks: {
    /**
     * SignIn Callback - First callback after OAuth/Credentials authentication
     *
     * This runs BEFORE jwt callback and can block sign-in if it returns false.
     * Use this to detect and log authentication issues early.
     */
    async signIn({ user, account, profile }) {
      authLogger.callback("signIn", {
        provider: account?.provider,
        accountType: account?.type,
        userId: user?.id,
        userEmail: user?.email,
        hasProfile: !!profile,
        profileEmail: (profile as any)?.email,
        timestamp: new Date().toISOString(),
      })

      // Log potential issues
      if (!user?.email) {
        authLogger.warn("SignIn: No email in user object", {
          user: { id: user?.id, name: user?.name },
          account: { provider: account?.provider, type: account?.type },
        })
      }

      // Facebook-specific checks
      if (account?.provider === "facebook") {
        if (!(profile as any)?.email) {
          authLogger.error(
            "Facebook OAuth: No email returned - check app permissions (email scope)",
            {
              profileKeys: profile ? Object.keys(profile) : [],
              profileId: (profile as any)?.id,
            }
          )
        }
      }

      // Google-specific checks
      if (account?.provider === "google") {
        if (!(profile as any)?.email_verified) {
          authLogger.warn("Google OAuth: Email not verified", {
            email: (profile as any)?.email,
          })
        }
      }

      authLogger.info("SignIn callback completed - allowing sign in")
      return true // Allow sign in to proceed
    },

    /**
     * JWT Callback - Token Population and Refresh
     *
     * Triggers:
     * - signIn: Initial sign-in, populate token with user data
     * - update: Manual session update (e.g., after onboarding creates school)
     * - (none): Token refresh on subsequent requests
     *
     * Key behaviors:
     * - Populates role/schoolId from user object on initial sign-in
     * - Forces DB refresh when schoolId missing (new OAuth users during onboarding)
     * - Updates cache-busting fields (updatedAt, hash, sessionToken) to force client refresh
     *
     * See: src/lib/school-access.ts syncUserSchoolContext() for how refresh is triggered
     */
    async jwt({ token, user, account, trigger }) {
      // Log JWT callback entry (always - critical for debugging)
      authLogger.callback("jwt", {
        trigger,
        hasUser: !!user,
        hasAccount: !!account,
        existingTokenId: token?.id,
        existingTokenRole: token?.role,
        existingTokenSchoolId: token?.schoolId,
      })

      if (user) {
        authLogger.debug("JWT: User data received", {
          id: user.id,
          email: user.email,
          hasRole: "role" in user,
          hasSchoolId: "schoolId" in user,
          role: (user as any).role,
          schoolId: (user as any).schoolId,
        })

        token.id = user.id
        // Only set role and schoolId if they exist on the user object
        if ("role" in user) {
          token.role = (user as any).role
          authLogger.debug("JWT: Role set in token", { role: token.role })
        }
        if ("schoolId" in user) {
          token.schoolId = (user as any).schoolId
          authLogger.debug("JWT: SchoolId set in token", {
            schoolId: token.schoolId,
          })
        }

        // Ensure we have a proper session token
        if (account) {
          token.provider = account.provider
          token.providerAccountId = account.providerAccountId
          authLogger.oauth(account.provider, "Account linked to token", {
            providerAccountId:
              account.providerAccountId?.substring(0, 10) + "...",
          })
        }

        // Force session update after OAuth
        if (trigger === "signIn") {
          authLogger.debug("JWT: Forcing session update after signIn")
          token.iat = Math.floor(Date.now() / 1000)
          token.exp = Math.floor(Date.now() / 1000) + 24 * 60 * 60 // 24 hours
          // Force session refresh by updating token
          token.sessionToken = `session_${Date.now()}`
          // Force session update by changing a critical field
          token.updatedAt = Date.now()
          // Force session refresh by updating the token hash
          token.hash = `hash_${Date.now()}`
        }
      }

      // PRODUCTION-READY: Force refresh schoolId from database during onboarding
      // This is triggered when:
      // 1. Session update is requested (trigger === 'update')
      // 2. Token doesn't have schoolId yet (new OAuth user during onboarding)
      // This ensures the JWT has the latest schoolId immediately after school creation
      if (trigger === "update" || (!token.schoolId && token.id)) {
        try {
          authLogger.debug("JWT: Refreshing from database", {
            trigger,
            tokenId: token.id,
            currentSchoolId: token.schoolId,
            reason:
              trigger === "update"
                ? "session update requested"
                : "no schoolId in token",
          })

          const dbUser = await db.user.findUnique({
            where: { id: token.id as string },
            select: { schoolId: true, role: true },
          })

          if (dbUser) {
            // Only update if database has newer/different values
            if (dbUser.schoolId && dbUser.schoolId !== token.schoolId) {
              const previousSchoolId = token.schoolId
              token.schoolId = dbUser.schoolId
              token.updatedAt = Date.now()
              token.hash = `hash_${Date.now()}`
              authLogger.info("JWT: SchoolId refreshed from database", {
                newSchoolId: dbUser.schoolId,
                previousSchoolId,
              })
            }
            if (dbUser.role && dbUser.role !== token.role) {
              const previousRole = token.role
              token.role = dbUser.role
              authLogger.info("JWT: Role refreshed from database", {
                newRole: dbUser.role,
                previousRole,
              })
            }
          }
        } catch (error) {
          // Don't fail the JWT callback on refresh errors - log and continue
          authLogger.exception("JWT: Error refreshing from database", error)
        }
      }

      // Log JWT state at end of callback (always - critical for debugging)
      authLogger.callback("jwt-complete", {
        tokenId: token?.id,
        role: token?.role,
        schoolId: token?.schoolId,
        provider: token?.provider,
        hasSessionToken: !!token?.sessionToken,
      })

      return token
    },
    async session({ session, token, trigger }) {
      // Log session callback entry (always - critical for debugging)
      authLogger.callback("session", {
        trigger,
        hasToken: !!token,
        sessionUserId: session.user?.id,
        tokenId: token?.id,
        tokenRole: token?.role,
        tokenSchoolId: token?.schoolId,
      })

      if (token) {
        // Always ensure we have the latest token data
        session.user.id = token.id as string

        // Check for preview role from cookies
        // Wrapped in try-catch because cookies() may not be available in all contexts
        let previewRoleCookie: { value?: string } | undefined
        let previewModeCookie: { value?: string } | undefined
        try {
          const cookieStore = await cookies()
          previewRoleCookie = cookieStore.get("preview-role")
          previewModeCookie = cookieStore.get("preview-mode")
        } catch {
          // cookies() not available in this context - skip preview mode check
        }

        // Apply role from preview or token
        if (previewModeCookie?.value === "true" && previewRoleCookie?.value) {
          // Apply preview role if preview mode is active
          ;(session.user as any).role = previewRoleCookie.value
          ;(session.user as any).isPreviewMode = true
          authLogger.debug("Session: Preview role applied", {
            role: previewRoleCookie.value,
          })
        } else if (token.role) {
          // Apply normal role from token
          ;(session.user as any).role = token.role
          ;(session.user as any).isPreviewMode = false
        }
        if (token.schoolId) {
          ;(session.user as any).schoolId = token.schoolId
        }

        // Force session update if token has been updated
        if (token.updatedAt) {
          ;(session as any).updatedAt = token.updatedAt
        }

        // Force session refresh if token hash changed
        if (token.hash) {
          ;(session as any).hash = token.hash
        }
      } else {
        authLogger.warn("Session: No token available in callback")
      }

      // Log session callback completion
      authLogger.callback("session-complete", {
        userId: session.user?.id,
        role: (session.user as any)?.role,
        schoolId: (session.user as any)?.schoolId,
        isPreviewMode: (session.user as any)?.isPreviewMode,
      })

      return session
    },
    /**
     * Redirect Callback - Multi-Tenant Post-Auth Routing
     *
     * Handles post-authentication redirects across subdomains.
     *
     * PRIORITY ORDER:
     * 1. Callback URL (from cookie → URL params → baseUrl params)
     * 2. Subdomain detection from host → school dashboard
     * 3. Main domain locale path (e.g., /en, /ar) → locale homepage
     * 4. Smart redirect: JWT → school lookup → school subdomain dashboard
     * 5. Fallback: main domain dashboard
     *
     * GOTCHAS:
     * - Facebook OAuth adds #_=_ hash that must be stripped
     * - Callback URLs validated for same-origin security
     * - ed.databayt.org is main domain, NOT a tenant
     */
    async redirect({ url, baseUrl }) {
      // Strip Facebook's #_=_ hash
      if (url.includes("#_=_")) {
        url = url.replace(/#.*$/, "")
      }

      // --- Step 1: Resolve callback URL ---
      const callbackUrl = await resolveCallbackUrl(url, baseUrl)
      if (callbackUrl) {
        const validated = validateCallbackUrl(callbackUrl, baseUrl)
        if (validated) return validated
      }

      // --- Step 2: Detect subdomain from host → redirect to school dashboard ---
      const host = getHostFromUrl(url, baseUrl)
      const subdomain = detectSubdomainFromHost(host)

      if (subdomain) {
        const locale = extractLocaleFromUrl(url)
        return constructSchoolUrl(subdomain, `/${locale}/dashboard`)
      }

      // --- Step 3: Main domain handling ---
      if (isMainDomain(host)) {
        // Locale homepage path (e.g., /en, /ar) — used by login action for non-DEVELOPER users
        if (url.match(/^\/(en|ar)\/?$/)) {
          return `${baseUrl}${url.endsWith("/") ? url.slice(0, -1) : url}`
        }

        // Check for tenant parameter in URL
        const tenant = extractTenantParam(url, baseUrl)
        if (tenant) {
          const locale = extractLocaleFromUrl(url)
          return constructSchoolUrl(tenant, `/${locale}/dashboard`)
        }

        // Logout: URL is exactly "/"
        if (url === "/") {
          return `${baseUrl}/ar`
        }

        // School subdomain logout path (e.g., /ar/s/school/)
        const schoolLogoutMatch = url.match(/^\/([a-z]{2})\/s\/([^/]+)\/?$/)
        if (schoolLogoutMatch) {
          return `${baseUrl}/${schoolLogoutMatch[1]}/s/${schoolLogoutMatch[2]}/`
        }

        // --- Step 4: Smart redirect based on user's JWT ---
        const smartUrl = await getSmartRedirectUrl(url, baseUrl)
        if (smartUrl) return smartUrl

        // --- Step 5: Fallback to main dashboard ---
        return `${baseUrl}/dashboard`
      }

      // --- Step 4 (non-main domain): Smart redirect ---
      const tenant = extractTenantParam(url, baseUrl)
      if (tenant) {
        const locale = extractLocaleFromUrl(url)
        return constructSchoolUrl(tenant, `/${locale}/dashboard`)
      }

      // Logout paths
      if (url === "/") return `${baseUrl}/ar`
      const schoolLogoutMatch = url.match(/^\/([a-z]{2})\/s\/([^/]+)\/?$/)
      if (schoolLogoutMatch) {
        return `${baseUrl}/${schoolLogoutMatch[1]}/s/${schoolLogoutMatch[2]}/`
      }

      const smartUrl = await getSmartRedirectUrl(url, baseUrl)
      if (smartUrl) return smartUrl

      return `${baseUrl}/dashboard`
    },
  },
  ...authConfig,
})
