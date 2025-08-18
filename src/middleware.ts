import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { 
  apiAuthPrefix, 
  authRoutes, 
  DEFAULT_LOGIN_REDIRECT, 
  publicRoutes 
} from "./routes"

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

  // Subdomain → tenant mapping (attach x-school-id header)
  try {
    const host = nextUrl.hostname
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN // e.g. "ed.databayt.org"
    
    // Debug logging
    console.log('Middleware Debug:', { host, rootDomain, pathname })
    
    let resolvedSchoolId: string | null = null
    // Dev convenience: /?x-school=<domain>
    const devDomainParam = nextUrl.searchParams.get("x-school")
    if (devDomainParam) {
      // hint to the type checker that we intentionally may set this below
      resolvedSchoolId = null
    }
    // We cannot query DB in middleware; use header propagation via later server code.
    // We pass the subdomain (or x-school) as a header; server code resolves to schoolId.
    let subdomain: string | null = null
    if (devDomainParam) {
      subdomain = devDomainParam
    } else if (rootDomain && host.endsWith("." + rootDomain)) {
      subdomain = host.slice(0, -(rootDomain.length + 1)) || null
    }
    
    // Debug logging
    console.log('Subdomain extracted:', { subdomain, host, rootDomain })
    
    if (subdomain) {
      const requestHeaders = new Headers(req.headers)
      requestHeaders.set("x-subdomain", subdomain)
      console.log('Setting x-subdomain header:', subdomain)
      return NextResponse.next({ request: { headers: requestHeaders } })
    }
  } catch (error) {
    // Log the actual error instead of swallowing it
    console.error('Subdomain middleware error:', error)
    // Don't fail the request, continue without subdomain
  }

  // Explicitly protect platform routes
  if (isPlatformRoute && !isLoggedIn) {
    const callbackUrl = pathname + nextUrl.search
    const encodedCallbackUrl = encodeURIComponent(callbackUrl)

    return NextResponse.redirect(new URL(
      `/login?callbackUrl=${encodedCallbackUrl}`,
      nextUrl
    ))
  }

  // Guard operator routes to DEVELOPER (platform admin) only — temporarily disabled for public demo
  // if (isOperatorRoute) {
  //   if (!isLoggedIn) {
  //     const callbackUrl = pathname + nextUrl.search
  //     const encodedCallbackUrl = encodeURIComponent(callbackUrl)
  //     return NextResponse.redirect(new URL(`/login?callbackUrl=${encodedCallbackUrl}`, nextUrl))
  //   }
  //   const role = req.auth?.user?.role
  //   if (role !== "DEVELOPER") {
  //     return NextResponse.redirect(new URL("/403", nextUrl))
  //   }
  // }

  if (!isLoggedIn && !isPublicRoute && !isDocsRoute) {
    const callbackUrl = pathname + nextUrl.search
    const encodedCallbackUrl = encodeURIComponent(callbackUrl)

    return NextResponse.redirect(new URL(
      `/login?callbackUrl=${encodedCallbackUrl}`,
      nextUrl
    ))
  }

  return
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}