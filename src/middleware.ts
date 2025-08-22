import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { 
  apiAuthPrefix, 
  authRoutes, 
  DEFAULT_LOGIN_REDIRECT, 
  publicRoutes 
} from "./routes"

// Constants for production
const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';

function extractSubdomain(request: any): string | null {
  const url = request.url;
  const host = request.headers.get('host') || '';
  const hostname = host.split(':')[0];

  // Local development environment
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    // Try to extract subdomain from the full URL
    const fullUrlMatch = url.match(/http:\/\/([^.]+)\.localhost/);
    if (fullUrlMatch && fullUrlMatch[1]) {
      return fullUrlMatch[1];
    }

    // Fallback to host header approach
    if (hostname.includes('.localhost')) {
      const subdomain = hostname.split('.')[0];
      return subdomain;
    }

    return null;
  }

  // Production environment
  const rootDomainFormatted = rootDomain.split(':')[0];

  // Handle preview deployment URLs (tenant---branch-name.vercel.app)
  if (hostname.includes('---') && hostname.endsWith('.vercel.app')) {
    const parts = hostname.split('---');
    const subdomain = parts.length > 0 ? parts[0] : null;
    return subdomain;
  }

  // Regular subdomain detection
  const isSubdomain =
    hostname !== rootDomainFormatted &&
    hostname !== `www.${rootDomainFormatted}` &&
    hostname.endsWith(`.${rootDomainFormatted}`);

  if (isSubdomain) {
    const subdomain = hostname.replace(`.${rootDomainFormatted}`, '');
    return subdomain;
  }

  return null;
}

// Middleware using Next.js 14/15 syntax
export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  const pathname = nextUrl.pathname
  
  const isApiAuthRoute = pathname.startsWith(apiAuthPrefix)
  const isPublicRoute = publicRoutes.includes(pathname)
  const isAuthRoute = authRoutes.includes(pathname)
  
  // Check if the route is a docs route (all docs routes are public)
  const isDocsRoute = pathname === "/docs" || pathname.startsWith("/docs/")
  // Operator routes are under /operator
  const isOperatorRoute = pathname === "/operator" || pathname.startsWith("/operator/")
  
  // Check if the route is in the platform directory
  const isPlatformRoute = 
    pathname === "/dashboard" || 
    pathname.startsWith("/dashboard/") ||
    pathname === "/project" || 
    pathname.startsWith("/project/") ||
    pathname === "/task" || 
    pathname.startsWith("/task/") ||
    pathname === "/wallet" || 
    pathname.startsWith("/wallet/") ||
    pathname === "/daily" || 
    pathname.startsWith("/daily/") ||
    pathname === "/resource" || 
    pathname.startsWith("/resource/");

  if (isApiAuthRoute) {
    return
  }

  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl))
    }
    return
  }

  // Allow all docs routes (they are public)
  if (isDocsRoute) {
    return
  }

  // Subdomain → tenant routing (Following reference pattern exactly)
  const subdomain = extractSubdomain(req);

  if (subdomain) {
    // Block access to admin page from subdomains
    if (pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Rewrite all paths on subdomains to include /s/${subdomain} prefix
    // This handles /, /about, /academic, /admission, etc.
    return NextResponse.rewrite(new URL(`/s/${subdomain}${pathname}`, req.url));
  }

  // Explicitly protect platform routes
  if (isPlatformRoute && !isLoggedIn) {
    const callbackUrl = pathname + nextUrl.search
    const encodedCallbackUrl = encodeURIComponent(callbackUrl)
    const actualHost = req.headers.get('host') || nextUrl.hostname
    const loginUrl = new URL(`/login?callbackUrl=${encodedCallbackUrl}`, `https://${actualHost}`)
    return NextResponse.redirect(loginUrl)
  }

  if (!isLoggedIn && !isPublicRoute && !isDocsRoute) {
    const callbackUrl = pathname + nextUrl.search
    const encodedCallbackUrl = encodeURIComponent(callbackUrl)
    const actualHost = req.headers.get('host') || nextUrl.hostname
    const loginUrl = new URL(`/login?callbackUrl=${encodedCallbackUrl}`, `https://${actualHost}`)
    return NextResponse.redirect(loginUrl)
  }

  return
})

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. all root files inside /public (e.g. /favicon.ico)
     */
    '/((?!api|_next|[\\w-]+\\.\\w+).*)'
  ]
};