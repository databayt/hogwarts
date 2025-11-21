import { NextResponse, NextRequest } from "next/server";
import { i18n, type Locale } from "@/components/internationalization/config";

/**
 * Optimized middleware for Edge Function (<1MB requirement)
 * - Auth check via cookie (no heavy NextAuth import)
 * - Inlined routes (no routes.ts import)
 * - Locale detection and routing
 * - Subdomain detection and rewriting
 */

// Inlined route arrays to avoid imports
const publicRoutes = ["/", "/new-verification", "/features", "/pricing", "/blog"];
const authRoutes = ["/login", "/join", "/error", "/reset", "/new-password"];

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

export function middleware(req: NextRequest) {
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

  // Check route type
  const isPublic = publicRoutes.includes(pathWithoutLocale) ||
                   pathWithoutLocale.startsWith('/docs') ||
                   pathWithoutLocale.startsWith('/stream');
  const isAuth = authRoutes.includes(pathWithoutLocale);
  const authenticated = isAuthenticated(req);

  // Redirect logged-in users away from auth pages
  if (isAuth && authenticated) {
    const response = NextResponse.redirect(new URL(`/${locale}/dashboard`, req.url));
    return response;
  }

  // Redirect unauthenticated users to login for protected routes
  if (!isPublic && !isAuth && !authenticated) {
    const callbackUrl = url.pathname + url.search;
    const loginUrl = new URL(`/${locale}/login`, req.url);
    loginUrl.searchParams.set('callbackUrl', callbackUrl);
    return NextResponse.redirect(loginUrl);
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

  // Subdomain detection
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
