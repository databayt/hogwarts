import { NextRequest, NextResponse } from "next/server"
import {
  isRouteAllowedForRole,
  isSaasDashboardRoute,
  type Role,
} from "@/routes"

import { i18n, type Locale } from "@/components/internationalization/config"

// --- Custom domain routing via Upstash Redis (Edge-compatible) ---
let _edgeRedis: import("@upstash/redis").Redis | null = null
let _edgeRedisAvailable: boolean | null = null

function getEdgeRedis(): import("@upstash/redis").Redis | null {
  if (_edgeRedisAvailable === false) return null
  if (_edgeRedis) return _edgeRedis
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    _edgeRedisAvailable = false
    return null
  }
  try {
    const { Redis } =
      require("@upstash/redis") as typeof import("@upstash/redis")
    _edgeRedis = new Redis({ url, token })
    _edgeRedisAvailable = true
    return _edgeRedis
  } catch {
    _edgeRedisAvailable = false
    return null
  }
}

/**
 * Look up a custom domain → subdomain mapping from Redis
 * Returns the school's subdomain if the host is a verified custom domain
 */
async function resolveCustomDomain(host: string): Promise<string | null> {
  const r = getEdgeRedis()
  if (!r) return null
  try {
    return await r.get<string>(`custom-domain:${host}`)
  } catch {
    return null
  }
}

/**
 * Edge Function Middleware - Multi-Tenant URL Rewriting
 *
 * CRITICAL: This runs on EVERY request. Must stay <1MB (Edge Function limit).
 * Uses lightweight patterns instead of importing NextAuth (too heavy).
 *
 * REQUEST FLOW:
 * 1. Skip static files and API auth routes (fast path)
 * 2. Detect locale from cookie or Accept-Language header
 * 3. Detect subdomain from host:
 *    - Production: school.databayt.org → "school"
 *    - Preview: tenant---branch.vercel.app → "tenant"
 *    - Development: subdomain.localhost:3000 → "subdomain"
 * 4. Auth check via session cookie (not NextAuth - too heavy)
 * 5. Role-based route protection via JWT decode (no crypto verification)
 * 6. URL rewrite: /dashboard → /[lang]/s/[subdomain]/dashboard
 *
 * GOTCHAS:
 * - Auth routes (/login, /join) are NOT rewritten - they exist globally
 * - ed.databayt.org is the main domain, NOT a subdomain
 * - JWT decode is lightweight; full verification in server actions
 * - x-subdomain header passed to downstream components
 *
 * See: src/lib/tenant-context.ts for how x-subdomain is consumed
 */

// Inlined route arrays to avoid imports
// NOTE: /onboarding removed from public routes - requires authentication
// This ensures server-side redirect to login instead of unreliable client-side check
const publicRoutes = [
  "/",
  "/new-verification",
  "/features",
  "/pricing",
  "/blog",
]
const authRoutes = [
  "/login",
  "/join",
  "/error",
  "/reset",
  "/new-password",
  "/access-denied",
]

// Public school-marketing routes (school subdomain public pages - no auth required)
// NOTE: /apply removed - requires auth to couple application to userId
const publicSiteRoutes = [
  "/about",
  "/academic",
  "/admissions",
  "/tour",
  "/inquiry",
]

// Lightweight locale detection
function getLocale(request: NextRequest): Locale {
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value
  if (cookieLocale && i18n.locales.includes(cookieLocale as Locale)) {
    return cookieLocale as Locale
  }

  const acceptLanguage = request.headers.get("accept-language")
  if (acceptLanguage) {
    const lang = acceptLanguage
      .split(",")[0]
      .split(";")[0]
      .split("-")[0]
      .trim()
      .toLowerCase()
    if (i18n.locales.includes(lang as Locale)) {
      return lang as Locale
    }
  }

  return i18n.defaultLocale
}

// Check if user is authenticated via session cookie
function isAuthenticated(request: NextRequest): boolean {
  return !!request.cookies.get("authjs.session-token")?.value
}

/**
 * Extract user role from JWT session cookie (lightweight - no NextAuth import)
 * JWT structure: header.payload.signature (base64url encoded)
 * Decodes payload to get role without cryptographic verification
 * (Full verification happens in auth() calls within server actions)
 */
function getRoleFromCookie(request: NextRequest): Role | null {
  const sessionCookie = request.cookies.get("authjs.session-token")?.value
  if (!sessionCookie) return null

  try {
    // JWT is base64url encoded: header.payload.signature
    const payload = sessionCookie.split(".")[1]
    if (!payload) return null

    // Convert base64url to base64 and decode
    const decoded = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    )

    // Role is stored in the JWT payload by NextAuth callbacks
    return (decoded.role as Role) || null
  } catch {
    // Invalid JWT format or decode error - fail gracefully
    return null
  }
}

export async function proxy(req: NextRequest) {
  const url = req.nextUrl.clone()
  const host = req.headers.get("host") || ""

  // Skip static files and ALL API routes (API routes don't need subdomain rewriting)
  // API routes handle their own auth and tenant context
  if (
    url.pathname.startsWith("/_next") ||
    url.pathname.startsWith("/api/") ||
    url.pathname.match(/\.(png|jpg|jpeg|gif|ico|svg|css|js|woff2?)$/)
  ) {
    return NextResponse.next()
  }

  // Check if pathname has locale
  const hasLocale = i18n.locales.some(
    (locale) =>
      url.pathname.startsWith(`/${locale}/`) || url.pathname === `/${locale}`
  )

  // Get current locale
  let locale: Locale
  if (hasLocale) {
    locale = url.pathname.split("/")[1] as Locale
  } else {
    locale = getLocale(req)
  }

  // Get pathname without locale
  const pathWithoutLocale = hasLocale
    ? url.pathname.replace(`/${locale}`, "") || "/"
    : url.pathname

  // Detect subdomain early - needed for auth redirects and URL rewriting
  // CRITICAL: ed.databayt.org is the main domain (saas-marketing school-marketing), NOT a tenant
  let subdomain: string | null = null

  if (host.endsWith(".databayt.org") && !host.startsWith("ed.")) {
    // Production: school.databayt.org → "school"
    subdomain = host.split(".")[0]
  } else if (host.includes("---") && host.endsWith(".vercel.app")) {
    // Vercel preview: tenant---branch.vercel.app → "tenant"
    subdomain = host.split("---")[0]
  } else if (host.includes("localhost") && host.includes(".")) {
    // Development: subdomain.localhost:3000 → "subdomain"
    const parts = host.split(".")
    if (parts.length > 1 && parts[0] !== "www" && parts[0] !== "localhost") {
      subdomain = parts[0]
    }
  }

  // Custom domain detection (e.g., school.edu.sa → resolve to subdomain via Redis)
  // Only check if no subdomain was found via standard patterns
  if (!subdomain) {
    const customSubdomain = await resolveCustomDomain(host)
    if (customSubdomain) {
      subdomain = customSubdomain
    }
  }

  // Check route type
  const isPublic =
    publicRoutes.includes(pathWithoutLocale) ||
    pathWithoutLocale.startsWith("/docs") ||
    pathWithoutLocale.startsWith("/stream")

  // Check if it's a public school-marketing route (for subdomains)
  // Handle both clean URLs (/apply) and internal paths (/s/{subdomain}/apply)
  const pathForRouteCheck = pathWithoutLocale.startsWith(`/s/${subdomain}/`)
    ? pathWithoutLocale.replace(`/s/${subdomain}`, "")
    : pathWithoutLocale

  const isPublicSiteRoute =
    subdomain &&
    (pathWithoutLocale === "/" ||
      pathWithoutLocale === `/s/${subdomain}` ||
      publicSiteRoutes.some(
        (route) =>
          pathForRouteCheck === route ||
          pathForRouteCheck.startsWith(`${route}/`)
      ))

  const isAuth = authRoutes.includes(pathWithoutLocale)
  const authenticated = isAuthenticated(req)

  // Redirect logged-in users away from auth pages
  if (isAuth && authenticated) {
    let redirectPath: string
    if (subdomain) {
      // School subdomain: redirect to school dashboard
      redirectPath = `/${locale}/s/${subdomain}/dashboard`
    } else {
      // Main domain: check role
      const role = getRoleFromCookie(req)
      if (role === "DEVELOPER") {
        // DEVELOPER → SaaS dashboard
        redirectPath = `/${locale}/dashboard`
      } else {
        // Non-DEVELOPER → stay on homepage (NOT dashboard, NOT onboarding)
        redirectPath = `/${locale}`
      }
    }
    const response = NextResponse.redirect(new URL(redirectPath, req.url))
    return response
  }

  // Redirect unauthenticated users to login for protected routes
  // Skip redirect for public school-marketing routes on subdomains (admission portal, etc.)
  if (!isPublic && !isPublicSiteRoute && !isAuth && !authenticated) {
    const callbackUrl = url.pathname + url.search
    const loginUrl = new URL(`/${locale}/login`, req.url)
    loginUrl.searchParams.set("callbackUrl", callbackUrl)
    if (subdomain) {
      loginUrl.searchParams.set("context", "school")
      loginUrl.searchParams.set("subdomain", subdomain)
    }
    return NextResponse.redirect(loginUrl)
  }

  // Role-based access control for authenticated users on protected routes
  // Check if user's role is allowed to access this route
  if (!isPublic && !isPublicSiteRoute && !isAuth && authenticated) {
    const role = getRoleFromCookie(req)

    // CRITICAL: SaaS Dashboard protection (main domain only, DEVELOPER required)
    // Main domain SaaS routes (/dashboard, /analytics, etc.) are DEVELOPER-only
    // School subdomain routes with same paths use school-dashboard (different file structure)
    if (!subdomain && role && isSaasDashboardRoute(pathForRouteCheck)) {
      if (role !== "DEVELOPER") {
        // Non-DEVELOPER trying to access SaaS dashboard on main domain
        // Redirect to access-denied (onboarding is only reachable via Get Started button)
        const accessDeniedUrl = `/${locale}/access-denied`
        const response = NextResponse.redirect(
          new URL(accessDeniedUrl, req.url)
        )
        response.headers.set("x-blocked-role", role)
        response.headers.set("x-blocked-route", pathForRouteCheck)
        response.headers.set(
          "x-blocked-reason",
          "saas-dashboard-developer-only"
        )
        return response
      }
    }

    // If role is available, check route permissions
    // If role is null (JWT decode failed), allow through - auth() in actions will verify
    if (role && !isRouteAllowedForRole(pathForRouteCheck, role)) {
      // Redirect to unauthorized page with context
      const unauthorizedUrl = subdomain
        ? `/${locale}/s/${subdomain}/unauthorized`
        : `/${locale}/unauthorized`
      const response = NextResponse.redirect(new URL(unauthorizedUrl, req.url))
      // Set header for debugging/logging
      response.headers.set("x-blocked-role", role)
      response.headers.set("x-blocked-route", pathForRouteCheck)
      return response
    }
  }

  // Main domain handling
  if (
    host === "ed.databayt.org" ||
    host === "localhost:3000" ||
    host === "localhost"
  ) {
    if (!hasLocale) {
      url.pathname = `/${locale}${url.pathname}`
      const response = NextResponse.redirect(url)
      response.cookies.set("NEXT_LOCALE", locale, {
        maxAge: 31536000,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      })
      return response
    }
    return NextResponse.next()
  }

  // Subdomain handling (subdomain already detected earlier)
  if (subdomain) {
    if (!hasLocale) {
      url.pathname = `/${locale}${url.pathname}`
      const response = NextResponse.redirect(url)
      response.cookies.set("NEXT_LOCALE", locale, {
        maxAge: 31536000,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      })
      return response
    }

    // Don't rewrite auth routes - they exist globally at /[lang]/(auth)/*
    // NOT within subdomain structure /[lang]/s/[subdomain]/(auth)/*
    // GOTCHA: If you add auth routes to subdomain structure, users see 404
    if (isAuth) {
      return NextResponse.next()
    }

    // URL REWRITE: This is the core multi-tenant magic
    // User sees: school.databayt.org/dashboard
    // Server sees: school.databayt.org/en/s/school/dashboard
    // File lives at: src/app/[lang]/s/[subdomain]/(school-dashboard)/dashboard/page.tsx
    url.pathname = `/${locale}/s/${subdomain}${pathWithoutLocale}`

    const response = NextResponse.rewrite(url)
    // Pass subdomain to downstream components via header
    // Consumed by: src/lib/tenant-context.ts getTenantContext()
    response.headers.set("x-subdomain", subdomain)
    return response
  }

  // Default: add locale if missing
  if (!hasLocale) {
    url.pathname = `/${locale}${url.pathname}`
    const response = NextResponse.redirect(url)
    response.cookies.set("NEXT_LOCALE", locale, {
      maxAge: 31536000,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })
    return response
  }

  return NextResponse.next()
}

export const config = {
  // Exclude: _next, static files, and ALL API routes from middleware
  matcher: ["/((?!_next/|api/|.*\\..*).*)"],
}
