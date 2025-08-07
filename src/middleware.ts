import { auth } from "@/auth"
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
      return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl))
    }
    return
  }

  // Allow all docs routes (they are public)
  if (isDocsRoute) {
    return
  }

  // Explicitly protect platform routes
  if (isPlatformRoute && !isLoggedIn) {
    const callbackUrl = pathname + nextUrl.search
    const encodedCallbackUrl = encodeURIComponent(callbackUrl)

    return Response.redirect(new URL(
      `/login?callbackUrl=${encodedCallbackUrl}`,
      nextUrl
    ))
  }

  if (!isLoggedIn && !isPublicRoute) {
    const callbackUrl = pathname + nextUrl.search
    const encodedCallbackUrl = encodeURIComponent(callbackUrl)

    return Response.redirect(new URL(
      `/login?callbackUrl=${encodedCallbackUrl}`,
      nextUrl
    ))
  }

  return
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}