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

// Custom function to check if user has a valid session token
function hasValidSessionToken(cookieHeader: string | null): boolean {
  if (!cookieHeader) return false;
  
  // Look for the session token cookie
  const sessionTokenMatch = cookieHeader.match(/authjs\.session-token=([^;]+)/);
  if (!sessionTokenMatch || !sessionTokenMatch[1]) return false;
  
  const sessionToken = sessionTokenMatch[1];
  console.log('🔍 Custom session check - Found session token:', sessionToken ? 'Present' : 'Missing');
  
  // Basic validation - check if token exists and has content
  // Also check if it's not just an empty or invalid token
  const isValidToken = Boolean(sessionToken && 
                      sessionToken.length > 10 && 
                      !sessionToken.includes('undefined') &&
                      !sessionToken.includes('null'));
  
  console.log('🔍 Custom session check - Token validation:', {
    hasToken: !!sessionToken,
    tokenLength: sessionToken?.length,
    isValidToken
  });
  
  return isValidToken;
}

// Enhanced function to check for any authentication indicators
function hasAnyAuthenticationIndicators(cookieHeader: string | null): boolean {
  if (!cookieHeader) return false;
  
  // Check for session token
  const hasSessionToken = hasValidSessionToken(cookieHeader);
  
  // Check for other auth-related cookies
  const hasCsrfToken = Boolean(cookieHeader.includes('authjs.csrf-token'));
  const hasCallbackUrl = Boolean(cookieHeader.includes('authjs.callback-url'));
  
  // Check if we have any combination of auth indicators
  const hasAuthIndicators = hasSessionToken || (hasCsrfToken && hasCallbackUrl);
  
  console.log('🔍 Enhanced auth check:', {
    hasSessionToken,
    hasCsrfToken,
    hasCallbackUrl,
    hasAuthIndicators
  });
  
  return hasAuthIndicators;
}

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

  // Add detailed debugging for auth session
  console.log('🔍 MIDDLEWARE AUTH DEBUG:', {
    hasAuth: !!req.auth,
    authKeys: req.auth ? Object.keys(req.auth) : null,
    authUser: req.auth?.user ? { id: req.auth.user.id, email: req.auth.user.email } : null,
    cookies: req.headers.get('cookie') ? 'Present' : 'Missing',
    host: req.headers.get('host'),
    allCookies: req.headers.get('cookie') || 'None',
    sessionToken: req.headers.get('cookie')?.includes('authjs.session-token') ? 'Found' : 'Missing',
    csrfToken: req.headers.get('cookie')?.includes('authjs.csrf-token') ? 'Found' : 'Missing',
    cookieDetails: req.headers.get('cookie')?.split(';').map(c => c.trim().split('=')[0]) || []
  });

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
    pathname === "/students" || 
    pathname.startsWith("/students/") ||
    pathname === "/teachers" || 
    pathname.startsWith("/teachers/") ||
    pathname === "/parents" || 
    pathname.startsWith("/parents/") ||
    pathname === "/classes" || 
    pathname.startsWith("/classes/") ||
    pathname === "/subjects" || 
    pathname.startsWith("/subjects/") ||
    pathname === "/announcements" || 
    pathname.startsWith("/announcements/") ||
    pathname === "/attendance" || 
    pathname.startsWith("/attendance/") ||
    pathname === "/assignments" || 
    pathname.startsWith("/assignments/") ||
    pathname === "/exams" || 
    pathname.startsWith("/exams/") ||
    pathname === "/results" || 
    pathname.startsWith("/results/") ||
    pathname === "/events" || 
    pathname.startsWith("/events/") ||
    pathname === "/lessons" || 
    pathname.startsWith("/lessons/") ||
    pathname === "/timetable" || 
    pathname.startsWith("/timetable/") ||
    pathname === "/settings" || 
    pathname.startsWith("/settings/") ||
    pathname === "/profile" || 
    pathname.startsWith("/profile/");

  if (isApiAuthRoute) {
    return
  }

  if (isAuthRoute) {
    console.log('🔐 AUTH ROUTE DETECTED:', { pathname, host: req.headers.get('host') });
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

  // Debug logging for subdomain detection
  console.log('🔍 Middleware Debug:', {
    pathname,
    host: req.headers.get('host'),
    subdomain,
    isPlatformRoute,
    isLoggedIn
  });

  if (subdomain) {
    console.log('🚨 SUBDOMAIN DETECTED:', subdomain);
    console.log('🚨 PATHNAME:', pathname);
    console.log('🚨 IS PLATFORM ROUTE:', isPlatformRoute);
    console.log('🚨 AUTH STATUS:', { isLoggedIn, hasAuth: !!req.auth });
    
    // Block access to admin page from subdomains
    if (pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Rewrite all paths on subdomains to include /s/${subdomain} prefix
    // This handles /, /about, /academic, /admission, etc.
    // IMPORTANT: This must happen BEFORE the auth check to ensure proper routing
    const rewrittenUrl = new URL(`/s/${subdomain}${pathname}`, req.url);
    
    console.log('🚨 REWRITING TO:', rewrittenUrl.toString());
    
    // Handle auth for platform routes on subdomains AFTER rewriting
    if (isPlatformRoute && !isLoggedIn) {
      // Try enhanced authentication check for cross-subdomain authentication
      const hasEnhancedAuth = hasAnyAuthenticationIndicators(req.headers.get('cookie'));
      console.log('🚨 Enhanced auth check result:', hasEnhancedAuth);
      
      // Additional debugging for cookie analysis
      const cookies = req.headers.get('cookie');
      if (cookies) {
        const cookieList = cookies.split(';').map(c => c.trim());
        console.log('🚨 All cookies on subdomain:', cookieList);
        
        // Check for any auth-related cookies
        const authCookies = cookieList.filter(c => c.includes('authjs'));
        console.log('🚨 Auth-related cookies:', authCookies);
        
        // Check if we have any valid authentication indicators
        const hasAnyAuthCookie = authCookies.length > 0;
        console.log('🚨 Has any auth cookie:', hasAnyAuthCookie);
      }
      
      if (hasEnhancedAuth) {
        console.log('✅ Enhanced auth check passed, allowing access to subdomain');
        console.log('🚨 FINAL REWRITE (with enhanced auth):', rewrittenUrl.toString());
        return NextResponse.rewrite(rewrittenUrl);
      }
      
      const callbackUrl = pathname + nextUrl.search
      const encodedCallbackUrl = encodeURIComponent(callbackUrl)
      console.log('🚨 REDIRECTING TO MAIN DOMAIN LOGIN:', `/login?callbackUrl=${encodedCallbackUrl}`);
      console.log('🚨 AUTH DEBUG - Cookies present:', !!req.headers.get('cookie'));
      console.log('🚨 AUTH DEBUG - Auth object:', req.auth);
      // Redirect to main domain login page (since we only have one login page)
      const mainDomain = 'http://localhost:3000';
      return NextResponse.redirect(new URL(`/login?callbackUrl=${encodedCallbackUrl}`, mainDomain))
    }
    
    console.log('🚨 FINAL REWRITE:', rewrittenUrl.toString());
    return NextResponse.rewrite(rewrittenUrl);
  }

  // Explicitly protect platform routes
  if (isPlatformRoute && !isLoggedIn) {
    const callbackUrl = pathname + nextUrl.search
    const encodedCallbackUrl = encodeURIComponent(callbackUrl)
    const actualHost = req.headers.get('host') || nextUrl.hostname
    // Use http for localhost, https for production
    const protocol = actualHost.includes('localhost') ? 'http' : 'https'
    const loginUrl = new URL(`/login?callbackUrl=${encodedCallbackUrl}`, `${protocol}://${actualHost}`)
    return NextResponse.redirect(loginUrl)
  }

  if (!isLoggedIn && !isPublicRoute && !isDocsRoute) {
    const callbackUrl = pathname + nextUrl.search
    const encodedCallbackUrl = encodeURIComponent(callbackUrl)
    const actualHost = req.headers.get('host') || nextUrl.hostname
    // Use http for localhost, https for production
    const protocol = actualHost.includes('localhost') ? 'http' : 'https'
    const loginUrl = new URL(`/login?callbackUrl=${encodedCallbackUrl}`, `${protocol}://${actualHost}`)
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