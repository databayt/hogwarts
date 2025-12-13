import { NextResponse, NextRequest } from "next/server";
import { i18n, type Locale } from "@/components/internationalization/config";
import { isRouteAllowedForRole, type Role } from "@/routes";

/**
 * Optimized middleware for Edge Function (<1MB requirement)
 * - Auth check via cookie (no heavy NextAuth import)
 * - Role-based route protection via JWT decode
 * - Locale detection and routing
 * - Subdomain detection and rewriting
 */

// Inlined route arrays to avoid imports
const publicRoutes = ["/", "/new-verification", "/features", "/pricing", "/blog"];
const authRoutes = ["/login", "/join", "/error", "/reset", "/new-password"];

// Public site routes (school subdomain public pages - no auth required)
const publicSiteRoutes = [
  "/about",
  "/academic",
  "/admissions",
  "/apply",
  "/tour",
  "/inquiry",
];

// Lightweight locale detection
function getLocale(request: NextRequest): Locale {
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (cookieLocale && i18n.locales.includes(cookieLocale as Locale)) {
    return cookieLocale as Locale;
  }

  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    const lang = acceptLanguage.split(',')[0].split(';')[0].split('-')[0].trim().toLowerCase();
    if (i18n.locales.includes(lang as Locale)) {
      return lang as Locale;
    }
  }

  return i18n.defaultLocale;
}

// Check if user is authenticated via session cookie
function isAuthenticated(request: NextRequest): boolean {
  return !!request.cookies.get('authjs.session-token')?.value;
}

/**
 * Extract user role from JWT session cookie (lightweight - no NextAuth import)
 * JWT structure: header.payload.signature (base64url encoded)
 * Decodes payload to get role without cryptographic verification
 * (Full verification happens in auth() calls within server actions)
 */
function getRoleFromCookie(request: NextRequest): Role | null {
  const sessionCookie = request.cookies.get('authjs.session-token')?.value;
  if (!sessionCookie) return null;

  try {
    // JWT is base64url encoded: header.payload.signature
    const payload = sessionCookie.split('.')[1];
    if (!payload) return null;

    // Convert base64url to base64 and decode
    const decoded = JSON.parse(
      atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    );

    // Role is stored in the JWT payload by NextAuth callbacks
    return (decoded.role as Role) || null;
  } catch {
    // Invalid JWT format or decode error - fail gracefully
    return null;
  }
}

export function proxy(req: NextRequest) {
  const url = req.nextUrl.clone();
  const host = req.headers.get("host") || "";

  // Skip static files and API auth routes
  if (
    url.pathname.startsWith("/_next") ||
    url.pathname.startsWith("/api/auth") ||
    url.pathname.match(/\.(png|jpg|jpeg|gif|ico|svg|css|js|woff2?)$/)
  ) {
    return NextResponse.next();
  }

  // Check if pathname has locale
  const hasLocale = i18n.locales.some(
    (locale) => url.pathname.startsWith(`/${locale}/`) || url.pathname === `/${locale}`
  );

  // Get current locale
  let locale: Locale;
  if (hasLocale) {
    locale = url.pathname.split('/')[1] as Locale;
  } else {
    locale = getLocale(req);
  }

  // Get pathname without locale
  const pathWithoutLocale = hasLocale
    ? url.pathname.replace(`/${locale}`, '') || '/'
    : url.pathname;

  // Detect subdomain early for auth redirects
  let subdomain: string | null = null;

  if (host.endsWith(".databayt.org") && !host.startsWith("ed.")) {
    subdomain = host.split(".")[0];
  } else if (host.includes("---") && host.endsWith(".vercel.app")) {
    subdomain = host.split("---")[0];
  } else if (host.includes("localhost") && host.includes(".")) {
    const parts = host.split(".");
    if (parts.length > 1 && parts[0] !== "www" && parts[0] !== "localhost") {
      subdomain = parts[0];
    }
  }

  // Check route type
  const isPublic = publicRoutes.includes(pathWithoutLocale) ||
                   pathWithoutLocale.startsWith('/docs') ||
                   pathWithoutLocale.startsWith('/stream');

  // Check if it's a public site route (for subdomains)
  // Handle both clean URLs (/apply) and internal paths (/s/{subdomain}/apply)
  const pathForRouteCheck = pathWithoutLocale.startsWith(`/s/${subdomain}/`)
    ? pathWithoutLocale.replace(`/s/${subdomain}`, '')
    : pathWithoutLocale;

  const isPublicSiteRoute = subdomain && (
    pathWithoutLocale === '/' ||
    pathWithoutLocale === `/s/${subdomain}` ||
    publicSiteRoutes.some(route =>
      pathForRouteCheck === route || pathForRouteCheck.startsWith(`${route}/`)
    )
  );

  const isAuth = authRoutes.includes(pathWithoutLocale);
  const authenticated = isAuthenticated(req);

  // Redirect logged-in users away from auth pages
  if (isAuth && authenticated) {
    // If on subdomain, redirect to subdomain dashboard
    const dashboardPath = subdomain
      ? `/${locale}/s/${subdomain}/dashboard`
      : `/${locale}/dashboard`;
    const response = NextResponse.redirect(new URL(dashboardPath, req.url));
    return response;
  }

  // Redirect unauthenticated users to login for protected routes
  // Skip redirect for public site routes on subdomains (admission portal, etc.)
  if (!isPublic && !isPublicSiteRoute && !isAuth && !authenticated) {
    const callbackUrl = url.pathname + url.search;
    const loginUrl = new URL(`/${locale}/login`, req.url);
    loginUrl.searchParams.set('callbackUrl', callbackUrl);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based access control for authenticated users on protected routes
  // Check if user's role is allowed to access this route
  if (!isPublic && !isPublicSiteRoute && !isAuth && authenticated) {
    const role = getRoleFromCookie(req);

    // If role is available, check route permissions
    // If role is null (JWT decode failed), allow through - auth() in actions will verify
    if (role && !isRouteAllowedForRole(pathForRouteCheck, role)) {
      // Redirect to unauthorized page with context
      const unauthorizedUrl = subdomain
        ? `/${locale}/s/${subdomain}/unauthorized`
        : `/${locale}/unauthorized`;
      const response = NextResponse.redirect(new URL(unauthorizedUrl, req.url));
      // Set header for debugging/logging
      response.headers.set('x-blocked-role', role);
      response.headers.set('x-blocked-route', pathForRouteCheck);
      return response;
    }
  }

  // Main domain handling
  if (host === "ed.databayt.org" || host === "localhost:3000" || host === "localhost") {
    if (!hasLocale) {
      url.pathname = `/${locale}${url.pathname}`;
      const response = NextResponse.redirect(url);
      response.cookies.set('NEXT_LOCALE', locale, {
        maxAge: 31536000,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
      return response;
    }
    return NextResponse.next();
  }

  // Subdomain handling (subdomain already detected earlier)
  if (subdomain) {
    if (!hasLocale) {
      url.pathname = `/${locale}${url.pathname}`;
      const response = NextResponse.redirect(url);
      response.cookies.set('NEXT_LOCALE', locale, {
        maxAge: 31536000,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
      return response;
    }

    // Don't rewrite auth routes - they exist globally at /[lang]/(auth)/*
    // NOT within subdomain structure /[lang]/s/[subdomain]/(auth)/*
    if (isAuth) {
      return NextResponse.next();
    }

    // Rewrite to tenant path
    url.pathname = `/${locale}/s/${subdomain}${pathWithoutLocale}`;

    const response = NextResponse.rewrite(url);
    response.headers.set('x-subdomain', subdomain);
    return response;
  }

  // Default: add locale if missing
  if (!hasLocale) {
    url.pathname = `/${locale}${url.pathname}`;
    const response = NextResponse.redirect(url);
    response.cookies.set('NEXT_LOCALE', locale, {
      maxAge: 31536000,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|.*\\..*).*)"],
};
