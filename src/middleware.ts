import { NextResponse, NextRequest } from "next/server";
import { authRoutes, publicRoutes, apiAuthPrefix } from "@/routes";
import { auth } from "@/auth";

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

  // Get session for authentication check
  const session = await auth();
  const isLoggedIn = !!session?.user;

  // Debug logging for subdomain handling
  console.log('🌐 MIDDLEWARE REQUEST:', {
    host,
    pathname: url.pathname,
    search: url.search,
    referer,
    timestamp: new Date().toISOString(),
    isBot: userAgent.includes('bot')
  });

  // Allow auth routes to be handled normally (don't rewrite for subdomains)
  if (authRoutes.includes(url.pathname)) {
    console.log('🔐 AUTH ROUTE - No rewrite:', { pathname: url.pathname, host });
    return NextResponse.next();
  }

  // Authentication protection for protected routes
  const isPublicRoute = publicRoutes.includes(url.pathname);
  const isOnboardingRoute = url.pathname.startsWith('/onboarding');
  
  // Redirect to login if accessing protected routes without authentication
  if (!isLoggedIn && !isPublicRoute) {
    console.log('🚫 UNAUTHORIZED ACCESS - Redirecting to login:', { 
      pathname: url.pathname, 
      host, 
      isLoggedIn,
      isPublicRoute 
    });
    
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Special handling for onboarding routes - require authentication
  if (isOnboardingRoute && !isLoggedIn) {
    console.log('🎓 ONBOARDING ACCESS DENIED - Redirecting to login:', { 
      pathname: url.pathname, 
      host,
      userId: session?.user?.id 
    });
    
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', req.url);
    loginUrl.searchParams.set('message', 'Please sign in to continue with school setup');
    return NextResponse.redirect(loginUrl);
  }

  // If user is logged in and accessing auth routes, redirect to dashboard
  if (isLoggedIn && authRoutes.includes(url.pathname)) {
    console.log('🏠 ALREADY LOGGED IN - Redirecting to dashboard:', { 
      pathname: url.pathname, 
      userId: session?.user?.id 
    });
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Case 1: ed.databayt.org = marketing
  if (host === "ed.databayt.org") {
    console.log('🏢 MAIN DOMAIN - Marketing routes:', { host, pathname: url.pathname });
    return NextResponse.next();
  }

  // Case 2: other subdomains = tenants (production)
  if (host.endsWith(".databayt.org")) {
    const subdomain = host.split(".")[0];
    console.log('🎯 PRODUCTION TENANT REWRITE:', { 
      originalHost: host, 
      subdomain, 
      originalPath: url.pathname,
      newPath: `/s/${subdomain}${url.pathname}`
    });
    url.pathname = `/s/${subdomain}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // Case 3: Vercel preview URLs (tenant---branch.vercel.app)
  if (host.includes("---") && host.endsWith(".vercel.app")) {
    const subdomain = host.split("---")[0];
    console.log('🚀 VERCEL TENANT REWRITE:', { 
      originalHost: host, 
      subdomain, 
      originalPath: url.pathname,
      newPath: `/s/${subdomain}${url.pathname}`
    });
    url.pathname = `/s/${subdomain}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // Case 4: localhost development
  if (host.includes("localhost") && host.includes(".")) {
    const parts = host.split(".");
    if (parts.length > 1 && parts[0] !== "www") {
      const subdomain = parts[0];
      console.log('🏠 DEVELOPMENT TENANT REWRITE:', { 
        originalHost: host, 
        subdomain, 
        originalPath: url.pathname,
        newPath: `/s/${subdomain}${url.pathname}`,
        hostParts: parts
      });
      url.pathname = `/s/${subdomain}${url.pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  console.log('✅ NO REWRITE - Default behavior:', { host, pathname: url.pathname });
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|.*\\..*).*)"],
};