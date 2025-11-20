import { NextResponse, NextRequest } from "next/server";
import { authRoutes, publicRoutes, apiAuthPrefix } from "@/routes";
import { auth } from "@/auth";
import { match } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
import { i18n, type Locale } from "@/components/internationalization/config";
import { logger, generateRequestId } from "@/lib/logger";
import { addSecurityHeaders } from "@/middleware/security-headers";

// Helper function to apply security headers to response
function applySecurityHeaders(response: NextResponse, request: NextRequest): NextResponse {
  return addSecurityHeaders(request, response);
}

// Helper function to get locale from request
function getLocale(request: NextRequest): Locale {
  // 1. Check cookie first for user preference
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (cookieLocale && i18n.locales.includes(cookieLocale as Locale)) {
    return cookieLocale as Locale;
  }

  // 2. Get Accept-Language header
  const headers = {
    'accept-language': request.headers.get('accept-language') ?? '',
  };

  // Use negotiator to parse preferred languages
  const languages = new Negotiator({ headers }).languages();

  // Match against supported locales
  return match(languages, i18n.locales, i18n.defaultLocale) as Locale;
}

// Helper function to strip locale from pathname
function stripLocaleFromPathname(pathname: string): string {
  for (const locale of i18n.locales) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      return pathname.replace(`/${locale}`, '') || '/';
    }
  }
  return pathname;
}

export async function middleware(req: NextRequest) {
  // Generate requestId for this request
  const requestId = generateRequestId();

  const url = req.nextUrl.clone();
  const host = req.headers.get("host") || "";
  const userAgent = req.headers.get("user-agent") || "";
  const referer = req.headers.get("referer") || "";

  // Create base logging context
  const baseContext = { requestId, host, pathname: url.pathname };

  // Ignore static files and Next internals
  if (
    url.pathname.startsWith("/_next") ||
    url.pathname.startsWith(apiAuthPrefix) ||
    url.pathname.match(/\.(png|jpg|jpeg|gif|ico|svg|css|js|woff2?)$/)
  ) {
    return NextResponse.next();
  }

  // Check if pathname already has a locale
  const pathnameHasLocale = i18n.locales.some(
    (locale) => url.pathname.startsWith(`/${locale}/`) || url.pathname === `/${locale}`
  );

  // Get the current locale from the path or detect it
  let currentLocale: Locale = i18n.defaultLocale;
  if (pathnameHasLocale) {
    currentLocale = url.pathname.split('/')[1] as Locale;
  } else {
    currentLocale = getLocale(req);
  }

  // Get pathname without locale for route checking
  const pathnameWithoutLocale = stripLocaleFromPathname(url.pathname);

  // Determine if route needs authentication BEFORE querying database
  const isPublicRoute = publicRoutes.includes(pathnameWithoutLocale);
  const isOnboardingRoute = pathnameWithoutLocale.startsWith('/onboarding');
  const isDocsRoute = pathnameWithoutLocale.startsWith('/docs');
  const isAuthRoute = authRoutes.includes(pathnameWithoutLocale);
  // Stream routes can be at /stream or /s/[subdomain]/stream
  const isStreamPublicRoute = pathnameWithoutLocale.startsWith('/stream') || pathnameWithoutLocale.includes('/stream');

  // Skip expensive auth check for public routes
  const needsAuth = !isPublicRoute && !isDocsRoute && !isStreamPublicRoute && !isAuthRoute;

  // Conditional debug logging (only when enabled)
  if (process.env.LOG_MIDDLEWARE === 'true') {
    logger.debug('MIDDLEWARE REQUEST', {
      ...baseContext,
      pathnameWithoutLocale,
      currentLocale,
      search: url.search,
      referer,
      isBot: userAgent.includes('bot'),
      needsAuth
    });
  }

  // Handle auth routes (login, register, etc.)
  if (isAuthRoute) {
    // Check if user is already logged in (need auth check for this)
    const session = await auth();
    const isLoggedIn = !!session?.user;

    if (process.env.LOG_MIDDLEWARE === 'true') {
      logger.debug('AUTH ROUTE', { ...baseContext, pathname: pathnameWithoutLocale, isLoggedIn });
    }

    // If already logged in, redirect to dashboard
    if (isLoggedIn) {
      const response = NextResponse.redirect(new URL(`/${currentLocale}/dashboard`, req.url));
      response.headers.set('x-request-id', requestId);
      return response;
    }

    // Not logged in, allow access to auth pages
    // Add locale to auth routes if not present
    if (!pathnameHasLocale) {
      url.pathname = `/${currentLocale}${pathnameWithoutLocale}`;
      const response = NextResponse.redirect(url);
      response.headers.set('x-request-id', requestId);
      return response;
    }

    const response = NextResponse.next();
    response.headers.set('x-request-id', requestId);
    return response;
  }

  // Handle public routes without auth check (major performance win!)
  if (!needsAuth) {
    // Add locale if missing
    if (!pathnameHasLocale) {
      url.pathname = `/${currentLocale}${pathnameWithoutLocale}`;
      const response = NextResponse.redirect(url);
      response.headers.set('x-request-id', requestId);
      return response;
    }

    const response = NextResponse.next();
    response.headers.set('x-request-id', requestId);
    return response;
  }

  // Only check authentication for protected routes
  const session = await auth();
  const isLoggedIn = !!session?.user;

  // Enhanced logging with session info (only for protected routes)
  if (process.env.LOG_MIDDLEWARE === 'true') {
    logger.debug('PROTECTED ROUTE - Auth checked', {
      ...baseContext,
      pathnameWithoutLocale,
      isLoggedIn,
      userId: session?.user?.id,
      schoolId: session?.user?.schoolId
    });
  }

  // Redirect to login if accessing protected routes without authentication
  if (!isLoggedIn) {
    const callbackUrl = url.pathname + url.search;
    logger.info('UNAUTHORIZED ACCESS - Redirecting to login', {
      ...baseContext,
      pathnameWithoutLocale,
      isLoggedIn,
      isPublicRoute,
      isDocsRoute,
      callbackUrl
    });

    const loginUrl = new URL(`/${currentLocale}/login`, req.url);
    // Preserve the full path including pathname
    loginUrl.searchParams.set('callbackUrl', callbackUrl);
    const response = NextResponse.redirect(loginUrl);
    response.headers.set('x-request-id', requestId);
    return response;
  }

  // Note: Onboarding routes are handled above as protected routes (needsAuth=true)
  // Note: Auth route redirect for logged-in users is handled earlier (line 107-135)

  // Case 1: Main domain (ed.databayt.org) - handle i18n for marketing pages
  if (host === "ed.databayt.org" || host === "localhost:3000" || host === "localhost") {
    logger.debug('MAIN DOMAIN - Marketing routes with i18n', { ...baseContext, currentLocale });

    // If locale is not in URL, redirect to include it
    if (!pathnameHasLocale) {
      url.pathname = `/${currentLocale}${url.pathname}`;
      const response = NextResponse.redirect(url);

      // Set cookie for future visits
      response.cookies.set('NEXT_LOCALE', currentLocale, {
        maxAge: 365 * 24 * 60 * 60, // 1 year
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });

      response.headers.set('x-request-id', requestId);
      return response;
    }

    const response = NextResponse.next();
    response.headers.set('x-request-id', requestId);
    return response;
  }

  // For subdomain handling, we need to handle locale + subdomain rewriting
  let subdomain: string | null = null;

  // Case 2: Production subdomains (*.databayt.org)
  if (host.endsWith(".databayt.org") && !host.startsWith("ed.")) {
    subdomain = host.split(".")[0];
    logger.debug('PRODUCTION TENANT', { ...baseContext, subdomain });
  }

  // Case 3: Vercel preview URLs (tenant---branch.vercel.app)
  else if (host.includes("---") && host.endsWith(".vercel.app")) {
    subdomain = host.split("---")[0];
    logger.debug('VERCEL TENANT', { ...baseContext, subdomain });
  }

  // Case 4: localhost development with subdomain
  else if (host.includes("localhost") && host.includes(".")) {
    const parts = host.split(".");
    if (parts.length > 1 && parts[0] !== "www" && parts[0] !== "localhost") {
      subdomain = parts[0];
      logger.debug('DEVELOPMENT TENANT', { ...baseContext, subdomain });
    }
  }

  // If we have a subdomain, handle tenant routing with i18n
  if (subdomain) {
    logger.debug('TENANT REWRITE WITH I18N', {
      ...baseContext,
      subdomain,
      originalPath: url.pathname,
      currentLocale,
      pathnameHasLocale
    });

    // If locale is not in URL, redirect to include it
    if (!pathnameHasLocale) {
      url.pathname = `/${currentLocale}${url.pathname}`;
      const response = NextResponse.redirect(url);

      // Set cookie for future visits
      response.cookies.set('NEXT_LOCALE', currentLocale, {
        maxAge: 365 * 24 * 60 * 60, // 1 year
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });

      response.headers.set('x-request-id', requestId);
      return response;
    }

    // Rewrite to include subdomain in path: /[locale]/s/[subdomain]/...
    // Remove the locale temporarily, add subdomain path, then re-add locale
    const pathWithoutLocale = stripLocaleFromPathname(url.pathname);
    url.pathname = `/${currentLocale}/s/${subdomain}${pathWithoutLocale}`;

    logger.debug('FINAL REWRITE PATH', {
      ...baseContext,
      newPath: url.pathname,
      locale: currentLocale,
      subdomain,
      pathWithoutLocale
    });

    const response = NextResponse.rewrite(url);
    response.headers.set('x-request-id', requestId);
    response.headers.set('x-subdomain', subdomain);
    return response;
  }

  logger.debug('NO SPECIAL HANDLING - Default behavior', baseContext);

  // For main domain without locale, add it
  if (!pathnameHasLocale) {
    url.pathname = `/${currentLocale}${url.pathname}`;
    const response = NextResponse.redirect(url);

    // Set cookie for future visits
    response.cookies.set('NEXT_LOCALE', currentLocale, {
      maxAge: 365 * 24 * 60 * 60, // 1 year
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    // Add requestId to response headers
    response.headers.set('x-request-id', requestId);
    return response;
  }

  const response = NextResponse.next();
  response.headers.set('x-request-id', requestId);
  return applySecurityHeaders(response, req);
}

export const config = {
  matcher: ["/((?!_next/|.*\\..*).*)"],
};