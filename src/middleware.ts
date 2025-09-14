import { NextResponse, NextRequest } from "next/server";
import { authRoutes, publicRoutes, apiAuthPrefix } from "@/routes";
import { auth } from "@/auth";
import { match } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
import { i18n, type Locale } from "@/components/internationalization/config";

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
  const url = req.nextUrl.clone();
  const host = req.headers.get("host") || "";
  const userAgent = req.headers.get("user-agent") || "";
  const referer = req.headers.get("referer") || "";

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
  console.log('🌐 MIDDLEWARE REQUEST:', {
    host,
    pathname: url.pathname,
    pathnameWithoutLocale,
    currentLocale,
    search: url.search,
    referer,
    timestamp: new Date().toISOString(),
    isBot: userAgent.includes('bot')
  });

  // Allow auth routes to be handled normally (don't rewrite for subdomains)
  if (authRoutes.includes(pathnameWithoutLocale)) {
    console.log('🔐 AUTH ROUTE - No rewrite:', { pathname: pathnameWithoutLocale, host });

    // Add locale to auth routes if not present
    if (!pathnameHasLocale) {
      url.pathname = `/${currentLocale}${pathnameWithoutLocale}`;
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  // Authentication protection for protected routes
  const isPublicRoute = publicRoutes.includes(pathnameWithoutLocale);
  const isOnboardingRoute = pathnameWithoutLocale.startsWith('/onboarding');
  const isDocsRoute = pathnameWithoutLocale.startsWith('/docs');

  // Redirect to login if accessing protected routes without authentication
  if (!isLoggedIn && !isPublicRoute && !isDocsRoute) {
    console.log('🚫 UNAUTHORIZED ACCESS - Redirecting to login:', {
      pathname: pathnameWithoutLocale,
      host,
      isLoggedIn,
      isPublicRoute,
      isDocsRoute
    });

    const loginUrl = new URL(`/${currentLocale}/login`, req.url);
    // Preserve the full path including pathname
    const callbackUrl = url.pathname + url.search;
    loginUrl.searchParams.set('callbackUrl', callbackUrl);
    console.log('🔐 Setting callbackUrl:', { callbackUrl, loginUrl: loginUrl.toString() });
    return NextResponse.redirect(loginUrl);
  }

  // Special handling for onboarding routes - require authentication
  if (isOnboardingRoute && !isLoggedIn) {
    console.log('🎓 ONBOARDING ACCESS DENIED - Redirecting to login:', {
      pathname: pathnameWithoutLocale,
      host,
      userId: session?.user?.id
    });

    const loginUrl = new URL(`/${currentLocale}/login`, req.url);
    // Preserve the full onboarding path
    const callbackUrl = url.pathname + url.search;
    loginUrl.searchParams.set('callbackUrl', callbackUrl);
    loginUrl.searchParams.set('message', 'Please sign in to continue with school setup');
    console.log('🎓 Onboarding callbackUrl:', { callbackUrl, loginUrl: loginUrl.toString() });
    return NextResponse.redirect(loginUrl);
  }

  // If user is logged in and accessing auth routes, redirect to dashboard
  if (isLoggedIn && authRoutes.includes(pathnameWithoutLocale)) {
    console.log('🏠 ALREADY LOGGED IN - Redirecting to dashboard:', {
      pathname: pathnameWithoutLocale,
      userId: session?.user?.id
    });
    return NextResponse.redirect(new URL(`/${currentLocale}/dashboard`, req.url));
  }

  // Case 1: Main domain (ed.databayt.org) - handle i18n for marketing pages
  if (host === "ed.databayt.org" || host === "localhost:3000" || host === "localhost") {
    console.log('🏢 MAIN DOMAIN - Marketing routes with i18n:', { host, pathname: url.pathname, currentLocale });

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

      return response;
    }

    return NextResponse.next();
  }

  // For subdomain handling, we need to handle locale + subdomain rewriting
  let subdomain: string | null = null;

  // Case 2: Production subdomains (*.databayt.org)
  if (host.endsWith(".databayt.org") && !host.startsWith("ed.")) {
    subdomain = host.split(".")[0];
    console.log('🎯 PRODUCTION TENANT:', { subdomain });
  }

  // Case 3: Vercel preview URLs (tenant---branch.vercel.app)
  else if (host.includes("---") && host.endsWith(".vercel.app")) {
    subdomain = host.split("---")[0];
    console.log('🚀 VERCEL TENANT:', { subdomain });
  }

  // Case 4: localhost development with subdomain
  else if (host.includes("localhost") && host.includes(".")) {
    const parts = host.split(".");
    if (parts.length > 1 && parts[0] !== "www" && parts[0] !== "localhost") {
      subdomain = parts[0];
      console.log('🏠 DEVELOPMENT TENANT:', { subdomain });
    }
  }

  // If we have a subdomain, handle tenant routing with i18n
  if (subdomain) {
    console.log('🎯 TENANT REWRITE WITH I18N:', {
      originalHost: host,
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

      return response;
    }

    // Rewrite to include subdomain in path: /[locale]/s/[subdomain]/...
    // Remove the locale temporarily, add subdomain path, then re-add locale
    const pathWithoutLocale = stripLocaleFromPathname(url.pathname);
    url.pathname = `/${currentLocale}/s/${subdomain}${pathWithoutLocale}`;

    console.log('🎯 FINAL REWRITE PATH:', {
      newPath: url.pathname,
      locale: currentLocale,
      subdomain,
      pathWithoutLocale
    });

    return NextResponse.rewrite(url);
  }

  console.log('✅ NO SPECIAL HANDLING - Default behavior:', { host, pathname: url.pathname });

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

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|.*\\..*).*)"],
};