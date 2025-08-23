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

  console.log('🔍 SUBDOMAIN EXTRACTION START:', {
    url,
    host,
    hostname,
    rootDomain,
    isLocalhost: url.includes('localhost') || url.includes('127.0.0.1'),
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });

  // Local development environment
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    console.log('🔍 LOCALHOST ENVIRONMENT DETECTED');
    
    // Try to extract subdomain from the full URL
    const fullUrlMatch = url.match(/http:\/\/([^.]+)\.localhost/);
    if (fullUrlMatch && fullUrlMatch[1]) {
      console.log('🔍 Found subdomain from URL match:', fullUrlMatch[1]);
      return fullUrlMatch[1];
    }

    // Fallback to host header approach
    if (hostname.includes('.localhost')) {
      const subdomain = hostname.split('.')[0];
      console.log('🔍 Found subdomain from hostname:', subdomain);
      return subdomain;
    }

    console.log('🔍 No subdomain found in localhost');
    return null;
  }

  // Production environment
  const rootDomainFormatted = rootDomain.split(':')[0];

  console.log('🔍 PRODUCTION ENVIRONMENT ANALYSIS:', {
    hostname,
    rootDomain,
    rootDomainFormatted,
    isExactMatch: hostname === rootDomainFormatted,
    isWwwMatch: hostname === `www.${rootDomainFormatted}`,
    endsWithRoot: hostname.endsWith(`.${rootDomainFormatted}`),
    environment: process.env.NODE_ENV,
    hostnameLength: hostname.length,
    rootDomainLength: rootDomainFormatted.length
  });

  // Handle preview deployment URLs (tenant---branch-name.vercel.app)
  if (hostname.includes('---') && hostname.endsWith('.vercel.app')) {
    const parts = hostname.split('---');
    const subdomain = parts.length > 0 ? parts[0] : null;
    console.log('🔍 Vercel preview subdomain detected:', subdomain);
    return subdomain;
  }

  // Special handling for ed.databayt.org domain structure
  // Main domain: ed.databayt.org
  // Subdomains: khartoum.databayt.org, omdurman.databayt.org, etc.
  
  if (rootDomainFormatted === 'ed.databayt.org') {
    console.log('🔍 ED.DATABAYT.ORG DOMAIN STRUCTURE DETECTED');
    
    // Check if hostname is the main domain
    if (hostname === 'ed.databayt.org' || hostname === 'www.ed.databayt.org') {
      console.log('🎯 MAIN DOMAIN DETECTED - ed.databayt.org');
      return null;
    }
    
    // Check if it's a school subdomain (*.databayt.org but not ed.databayt.org)
    if (hostname.endsWith('.databayt.org') && hostname !== 'ed.databayt.org') {
      const subdomain = hostname.replace('.databayt.org', '');
      console.log('🎯 SCHOOL SUBDOMAIN DETECTED:', {
        originalHostname: hostname,
        extractedSubdomain: subdomain,
        isEdSubdomain: subdomain === 'ed',
        finalSubdomain: subdomain === 'ed' ? null : subdomain
      });
      
      // Special case: if someone tries to access ed.databayt.org as a subdomain
      if (subdomain === 'ed') {
        console.log('🚫 BLOCKING ed.databayt.org as subdomain - redirecting to main domain');
        return null;
      }
      
      return subdomain;
    }
    
    console.log('🔍 No valid subdomain pattern found for ed.databayt.org structure');
    return null;
  } else {
    // Regular subdomain detection for other domains
    console.log('🔍 REGULAR DOMAIN STRUCTURE - checking for subdomains');
    
    const isSubdomain =
      hostname !== rootDomainFormatted &&
      hostname !== `www.${rootDomainFormatted}` &&
      hostname.endsWith(`.${rootDomainFormatted}`);

    if (isSubdomain) {
      const subdomain = hostname.replace(`.${rootDomainFormatted}`, '');
      console.log('🎯 REGULAR SUBDOMAIN DETECTED:', {
        hostname,
        rootDomain: rootDomainFormatted,
        extractedSubdomain: subdomain
      });
      return subdomain;
    }
  }

  console.log('🔍 NO SUBDOMAIN DETECTED - returning null');
  return null;
}

// Middleware using Next.js 14/15 syntax
export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  // Add detailed debugging at the very start
  console.log('🚀 MIDDLEWARE START:', {
    method: req.method,
    url: req.url,
    pathname: nextUrl.pathname,
    host: req.headers.get('host'),
    origin: req.headers.get('origin'),
    referer: req.headers.get('referer'),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });

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
    console.log('🔐 API AUTH ROUTE - allowing through');
    return
  }

  if (isAuthRoute) {
    console.log('🔐 AUTH ROUTE DETECTED:', { pathname, host: req.headers.get('host') });
    if (isLoggedIn) {
      console.log('🔐 User already logged in, redirecting to dashboard');
      return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl))
    }
    console.log('🔐 Allowing auth route access');
    return
  }

  // Allow all docs routes (they are public)
  if (isDocsRoute) {
    console.log('📚 DOCS ROUTE - allowing through');
    return
  }

  // Subdomain → tenant routing (Following Vercel Platforms reference pattern)
  const subdomain = extractSubdomain(req);

  // Debug logging for subdomain detection
  console.log('🔍 MIDDLEWARE ROUTING DECISION:', {
    pathname,
    host: req.headers.get('host'),
    subdomain,
    isPlatformRoute,
    isLoggedIn,
    isPublicRoute,
    rootDomain,
    timestamp: new Date().toISOString()
  });

  if (subdomain) {
    console.log('🎯 SUBDOMAIN ROUTING ACTIVATED:', {
      subdomain,
      pathname,
      isPlatformRoute,
      isLoggedIn,
      host: req.headers.get('host')
    });
    
    // Block access to admin page from subdomains
    if (pathname.startsWith('/admin')) {
      console.log('🚫 BLOCKING ADMIN ACCESS FROM SUBDOMAIN - redirecting to home');
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Handle platform routes (protected routes that need auth)
    if (isPlatformRoute) {
      console.log('🔐 PLATFORM ROUTE DETECTED ON SUBDOMAIN:', {
        subdomain,
        pathname,
        isLoggedIn
      });
      
      if (!isLoggedIn) {
        // Try enhanced authentication check for cross-subdomain authentication
        const hasEnhancedAuth = hasAnyAuthenticationIndicators(req.headers.get('cookie'));
        console.log('🔍 Enhanced auth check result:', hasEnhancedAuth);
        
        if (hasEnhancedAuth) {
          console.log('✅ Enhanced auth check passed, allowing access to subdomain platform');
          const platformRewriteUrl = new URL(`/s/${subdomain}${pathname}`, req.url);
          console.log('🎯 PLATFORM REWRITE (with enhanced auth):', platformRewriteUrl.toString());
          return NextResponse.rewrite(platformRewriteUrl);
        }
        
        // Redirect unauthenticated users to main domain login
        const callbackUrl = pathname + nextUrl.search
        const encodedCallbackUrl = encodeURIComponent(callbackUrl)
        console.log('🔐 REDIRECTING TO MAIN DOMAIN LOGIN:', `/login?callbackUrl=${encodedCallbackUrl}`);
        
        // Use the correct protocol and domain for redirect
        const protocol = req.headers.get('host')?.includes('localhost') ? 'http' : 'https'
        const mainDomain = req.headers.get('host')?.includes('localhost') 
          ? 'localhost:3000' 
          : rootDomain
        const loginRedirectUrl = new URL(`/login?callbackUrl=${encodedCallbackUrl}`, `${protocol}://${mainDomain}`)
        console.log('🔐 LOGIN REDIRECT URL:', loginRedirectUrl.toString());
        return NextResponse.redirect(loginRedirectUrl)
      }
      
      // Authenticated platform route - rewrite to platform layout
      const platformRewriteUrl = new URL(`/s/${subdomain}${pathname}`, req.url);
      console.log('🎯 AUTHENTICATED PLATFORM REWRITE:', platformRewriteUrl.toString());
      return NextResponse.rewrite(platformRewriteUrl);
    }
    
    // Handle public site routes (/, /about, /academic, /admission, etc.)
    // These should go to the (site) layout, not (platform)
    // Following Vercel Platforms pattern: rewrite to /s/[subdomain] for root path
    if (pathname === '/') {
      const siteRewriteUrl = new URL(`/s/${subdomain}`, req.url);
      console.log('🎯 SITE REWRITE (root path):', siteRewriteUrl.toString());
      return NextResponse.rewrite(siteRewriteUrl);
    }
    
    // For other site routes, rewrite to the site layout
    const siteRewriteUrl = new URL(`/s/${subdomain}${pathname}`, req.url);
    console.log('🎯 SITE REWRITE:', siteRewriteUrl.toString());
    return NextResponse.rewrite(siteRewriteUrl);
  } else {
    console.log('🏠 MAIN DOMAIN ROUTING - no subdomain detected');
  }

  // Explicitly protect platform routes
  if (isPlatformRoute && !isLoggedIn) {
    console.log('🔐 PROTECTING PLATFORM ROUTE - redirecting to login');
    const callbackUrl = pathname + nextUrl.search
    const encodedCallbackUrl = encodeURIComponent(callbackUrl)
    const actualHost = req.headers.get('host') || nextUrl.hostname
    // Use http for localhost, https for production
    const protocol = actualHost.includes('localhost') ? 'http' : 'https'
    const loginUrl = new URL(`/login?callbackUrl=${encodedCallbackUrl}`, `${protocol}://${actualHost}`)
    console.log('🔐 LOGIN REDIRECT URL:', loginUrl.toString());
    return NextResponse.redirect(loginUrl)
  }

  if (!isLoggedIn && !isPublicRoute && !isDocsRoute) {
    console.log('🔐 PROTECTING PRIVATE ROUTE - redirecting to login');
    const callbackUrl = pathname + nextUrl.search
    const encodedCallbackUrl = encodeURIComponent(callbackUrl)
    const actualHost = req.headers.get('host') || nextUrl.hostname
    // Use http for localhost, https for production
    const protocol = actualHost.includes('localhost') ? 'http' : 'https'
    const loginUrl = new URL(`/login?callbackUrl=${encodedCallbackUrl}`, `${protocol}://${actualHost}`)
    console.log('🔐 LOGIN REDIRECT URL:', loginUrl.toString());
    return NextResponse.redirect(loginUrl)
  }

  console.log('✅ MIDDLEWARE COMPLETED - allowing request through');
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