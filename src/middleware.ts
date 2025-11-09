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

  // Get session for authentication check
  const session = await auth();
  const isLoggedIn = !!session?.user;

  // Debug logging for subdomain handling
  logger.debug('MIDDLEWARE REQUEST', {
    ...baseContext,
    pathnameWithoutLocale,
    currentLocale,
    search: url.search,
    referer,
    isBot: userAgent.includes('bot'),
    userId: session?.user?.id,
    schoolId: session?.user?.schoolId
  });

  // Allow auth routes to be handled normally (don't rewrite for subdomains)
  if (authRoutes.includes(pathnameWithoutLocale)) {
    logger.debug('AUTH ROUTE - No rewrite', { ...baseContext, pathname: pathnameWithoutLocale });

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

  // Authentication protection for protected routes
  const isPublicRoute = publicRoutes.includes(pathnameWithoutLocale);
  const isOnboardingRoute = pathnameWithoutLocale.startsWith('/onboarding');
  const isDocsRoute = pathnameWithoutLocale.startsWith('/docs');
  // Stream routes can be at /stream or /s/[subdomain]/stream
  const isStreamPublicRoute = pathnameWithoutLocale.startsWith('/stream') || pathnameWithoutLocale.includes('/stream');

  // Redirect to login if accessing protected routes without authentication
  if (!isLoggedIn && !isPublicRoute && !isDocsRoute && !isStreamPublicRoute) {
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

  // Special handling for onboarding routes - require authentication
  if (isOnboardingRoute && !isLoggedIn) {
    const callbackUrl = url.pathname + url.search;
    logger.info('ONBOARDING ACCESS DENIED - Redirecting to login', {
      ...baseContext,
      pathnameWithoutLocale,
      userId: session?.user?.id,
      callbackUrl
    });

    const loginUrl = new URL(`/${currentLocale}/login`, req.url);
    // Preserve the full onboarding path
    loginUrl.searchParams.set('callbackUrl', callbackUrl);
    loginUrl.searchParams.set('message', 'Please sign in to continue with school setup');
    const response = NextResponse.redirect(loginUrl);
    response.headers.set('x-request-id', requestId);
    return response;
  }

  // If user is logged in and accessing auth routes, redirect to lab
  if (isLoggedIn && authRoutes.includes(pathnameWithoutLocale)) {
    logger.debug('ALREADY LOGGED IN - Redirecting to lab', {
      ...baseContext,
      pathnameWithoutLocale,
      userId: session?.user?.id
    });
    const response = NextResponse.redirect(new URL(`/${currentLocale}/dashboard`, req.url));
    response.headers.set('x-request-id', requestId);
    return response;
  }

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