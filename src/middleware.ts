import { NextResponse, NextRequest } from "next/server";
import { i18n, type Locale } from "@/components/internationalization/config";

/**
 * Minimal middleware for Edge Function size optimization (<1MB requirement)
 *
 * Responsibilities:
 * - Locale detection and routing
 * - Subdomain detection and rewriting
 *
 * Auth protection moved to layout level to avoid heavy NextAuth bundle in Edge Function
 */

// Minimal locale detection
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

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const host = req.headers.get("host") || "";

  // Skip static files
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

  // Main domain
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
    const pathWithoutLocale = url.pathname.replace(`/${locale}`, '') || '/';
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
