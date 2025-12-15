/**
 * Security Headers Configuration
 *
 * Implements defense-in-depth security strategy via HTTP headers.
 *
 * HEADER TRADE-OFFS:
 *
 * X-DNS-Prefetch-Control: 'on'
 * - WHY: Enables DNS prefetching for faster navigation
 * - TRADE-OFF: Slight privacy leak (reveals which links user might click)
 * - DECISION: Performance benefit outweighs minimal privacy concern
 *
 * Strict-Transport-Security: 1 year
 * - WHY: Forces HTTPS for all future visits
 * - GOTCHA: Cannot downgrade to HTTP without waiting for max-age to expire
 * - DECISION: Use includeSubDomains for school.databayt.org subdomains
 *
 * X-Frame-Options: SAMEORIGIN
 * - WHY: Prevents clickjacking attacks
 * - GOTCHA: Stripe checkout requires 'frame-src' exception in CSP
 *
 * Referrer-Policy: origin-when-cross-origin
 * - WHY: Preserves referrer for same-origin (analytics) but strips path for cross-origin
 * - TRADE-OFF: Loses path info in analytics for external navigation
 *
 * Permissions-Policy: geolocation=(self)
 * - WHY: Attendance module needs geolocation for location-based check-in
 * - Camera/microphone disabled (not needed for current features)
 */

export const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "Referrer-Policy",
    value: "origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self)",
  },
]

/**
 * Content Security Policy (CSP) Configuration
 *
 * CSP NONCE STRATEGY:
 * - If nonce provided: Use 'nonce-xxx' for inline scripts (more secure)
 * - If no nonce: Fall back to 'unsafe-inline' (less secure but simpler)
 *
 * WHY FALLBACK:
 * Nonce generation requires middleware support. In some edge cases (static pages,
 * error pages), nonce may not be available. Falling back to 'unsafe-inline'
 * ensures the page renders rather than failing completely.
 *
 * GOTCHA: 'unsafe-inline' in style-src is required
 * - Many UI libraries (shadcn/ui, Framer Motion) inject inline styles
 * - Nonce for styles is impractical (would break dynamic style injection)
 *
 * EXTERNAL RESOURCES:
 * - Vercel Analytics/Insights: Required for production monitoring
 * - Stripe: For payment processing (checkout.stripe.com, js.stripe.com)
 * - Cloudinary/ImageKit: For optimized image delivery
 * - Sentry: For error tracking
 * - Pusher: For real-time WebSocket connections
 */
export function getCSPHeader(nonce?: string) {
  const cspDirectives = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      // WHY: Nonce is more secure but requires middleware to generate
      // Fall back to unsafe-inline for pages where nonce isn't available
      nonce ? `'nonce-${nonce}'` : "'unsafe-inline'",
      "*.vercel-insights.com",
      "*.vercel-analytics.com",
      "https://cdn.jsdelivr.net",
      "https://unpkg.com",
    ],
    "style-src": [
      "'self'",
      "'unsafe-inline'", // Required for inline styles
      "https://fonts.googleapis.com",
    ],
    "img-src": [
      "'self'",
      "data:",
      "blob:",
      "https://*.cloudinary.com",
      "https://res.cloudinary.com",
      "https://imagekit.io",
      "https://*.imagekit.io",
    ],
    "font-src": ["'self'", "https://fonts.gstatic.com"],
    "connect-src": [
      "'self'",
      "https://*.vercel-insights.com",
      "https://*.vercel-analytics.com",
      "https://*.sentry.io",
      "https://api.stripe.com",
      "wss://*.pusher.com",
      "https://*.pusher.com",
      process.env.NODE_ENV === "development" ? "ws://localhost:*" : "",
    ],
    "media-src": ["'self'"],
    "object-src": ["'none'"],
    "frame-src": [
      "'self'",
      "https://checkout.stripe.com",
      "https://js.stripe.com",
    ],
    "frame-ancestors": ["'self'"],
    "form-action": ["'self'"],
    "base-uri": ["'self'"],
    "manifest-src": ["'self'"],
    "worker-src": ["'self'", "blob:"],
  }

  return Object.entries(cspDirectives)
    .map(([key, values]) => `${key} ${values.filter(Boolean).join(" ")}`)
    .join("; ")
}

/**
 * Generate a random nonce for CSP
 *
 * WHY 3-TIER FALLBACK:
 * 1. window.crypto - Browser environment (client-side)
 * 2. global.crypto - Node.js environment (server-side, middleware)
 * 3. Math.random() - Last resort for edge cases
 *
 * GOTCHA: Math.random() is NOT cryptographically secure
 * The fallback exists for environments where crypto API is unavailable
 * (some edge runtimes, older browsers). For security-critical nonces,
 * ensure crypto is available or fail gracefully.
 *
 * 16 bytes = 128 bits of entropy (sufficient for CSP nonce)
 */
export function generateNonce(): string {
  const array = new Uint8Array(16)
  if (typeof window !== "undefined" && window.crypto) {
    // Browser environment
    window.crypto.getRandomValues(array)
  } else if (typeof global !== "undefined" && global.crypto) {
    // Node.js/server environment
    global.crypto.getRandomValues(array)
  } else {
    // GOTCHA: This fallback is NOT cryptographically secure
    // Only used when crypto API unavailable (rare edge case)
    for (let i = 0; i < 16; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
  }
  return Buffer.from(array).toString("base64")
}
