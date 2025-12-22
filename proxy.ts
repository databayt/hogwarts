import { proxy } from "./src/proxy"

// Export proxy function for Next.js 16.1.0+
export { proxy }

// Config must be inline (not re-exported) for Next.js
export const config = {
  // Exclude: _next, static files, and mobile API routes from proxy
  matcher: ["/((?!_next/|api/mobile/|.*\\..*).*)"],
}
