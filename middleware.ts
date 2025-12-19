import { proxy } from "./src/proxy"

// Export both names for compatibility
export { proxy }
export const middleware = proxy

// Config must be inline (not re-exported) for Next.js Turbopack
export const config = {
  // Exclude: _next, static files, and mobile API routes from middleware
  matcher: ["/((?!_next/|api/mobile/|.*\\..*).*)"],
}
