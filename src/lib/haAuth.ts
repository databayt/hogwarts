/**
 * Home Assistant OAuth2 Authentication Module
 *
 * PURPOSE: Provides OAuth2 authentication against Home Assistant instance
 * Enables integration with Home Assistant for IoT device control and monitoring
 *
 * ARCHITECTURE:
 * - OAuth2 grant_type=authorization_code flow (standard)
 * - Fallback to long-lived tokens if configured
 * - Token storage in browser localStorage
 * - Automatic token refresh using refresh_token
 *
 * AUTHENTICATION FLOW:
 * 1. login(): Redirect user to Home Assistant /auth/authorize endpoint
 * 2. User logs in and authorizes app
 * 3. Redirected back to REDIRECT_URI with authorization code
 * 4. exchangeCodeForToken(code): Exchange code for access + refresh tokens
 * 5. Tokens stored in localStorage
 * 6. Future requests use getAccessToken() for current valid token
 * 7. refreshAccessToken(): Auto-refresh when access token expires
 *
 * TOKENS:
 * - access_token: Short-lived (24 hours default), used for API calls
 * - refresh_token: Long-lived, used to obtain new access tokens
 * - expires_in: Seconds until access_token expires
 * - created_at: Timestamp when token was created (tracks expiry)
 * - token_type: Always "Bearer"
 *
 * ENVIRONMENT VARIABLES:
 * - VITE_HA_URL or NEXT_PUBLIC_HA_URL: Home Assistant hostname
 * - VITE_HA_PORT or NEXT_PUBLIC_HA_PORT: Home Assistant port (default 8123)
 * - VITE_HA_CLIENT_ID or NEXT_PUBLIC_HA_CLIENT_ID: OAuth2 client ID
 * - VITE_HA_REDIRECT_URI or NEXT_PUBLIC_HA_REDIRECT_URI: Post-login redirect
 * - VITE_HA_LONG_LIVED_TOKEN or NEXT_PUBLIC_HA_LONG_LIVED_TOKEN: Direct token (optional)
 *
 * ENVIRONMENT PRIORITY:
 * - Vite env vars checked first (development)
 * - Then NEXT_PUBLIC_* (available to frontend)
 * - Then NODE_ENV vars (backend only)
 * - Fallback: undefined (will error if required)
 *
 * CONSTRAINTS & GOTCHAS:
 * - localStorage is synchronous (blocking on slow devices)
 * - Tokens stored in plaintext (localStorage compromised = auth compromised)
 * - No PKCE support (code_challenge skipped for simplicity)
 * - Cross-tab token sync: Each tab has own copy (stale token possible)
 * - Token expiry check: Only on getAccessToken() call (not proactive)
 * - No logout mechanism (tokens persist in localStorage until cleared)
 *
 * SECURITY CONSIDERATIONS:
 * - Long-lived tokens (if used) are permanent (no auto-expire)
 * - Never expose tokens in console logs or error messages
 * - HTTPS required in production (OAuth2 security requirement)
 * - Implement PKCE for public clients (future enhancement)
 * - Consider httpOnly cookie storage instead of localStorage
 *
 * PERFORMANCE:
 * - Token refresh: ~500ms network roundtrip
 * - getAccessToken(): O(1) - just localStorage access
 * - getTimeToExpiryMs(): O(1) - local calculation
 *
 * ERROR HANDLING:
 * - Token exchange failure: Throws error (must redirect to login)
 * - Refresh failure: Throws error (user must re-login)
 * - getAccessToken() returns null if expired (graceful handling)
 * - All errors logged with [HA AUTH] prefix for debugging
 */

function getImportMetaEnv(key: string): string | undefined {
  try {
    // WHY: Support both Vite and Next.js environment variables
    // Vite uses import.meta.env at build time
    // Next.js doesn't support import.meta.env (throws error)
    // Check existence to avoid errors in Next.js
    // Cast to any to bypass TypeScript's ImportMeta type (no env property in Next.js)
    const meta = import.meta as { env?: Record<string, string> }
    return meta.env?.[key]
  } catch {
    return undefined
  }
}

// WHY: Multiple env var sources for flexibility
// Vite vars first (development, Vite projects)
// Then NEXT_PUBLIC_ (Next.js frontend)
// Then NODE_ENV vars (Next.js backend)
// Each tier is optional fallback
const HA_HOST =
  getImportMetaEnv("VITE_HA_URL") ||
  process.env.NEXT_PUBLIC_HA_URL ||
  process.env.HA_URL // e.g. homeassistant.local
const HA_PORT =
  getImportMetaEnv("VITE_HA_PORT") ||
  process.env.NEXT_PUBLIC_HA_PORT ||
  process.env.HA_PORT // e.g. 8123
const HA_HTTP_URL = `http://${HA_HOST}:${HA_PORT}`

// OAuth2 app credentials (must match Home Assistant config)
const CLIENT_ID =
  getImportMetaEnv("VITE_HA_CLIENT_ID") ?? process.env.NEXT_PUBLIC_HA_CLIENT_ID!
const REDIRECT_URI =
  getImportMetaEnv("VITE_HA_REDIRECT_URI") ??
  process.env.NEXT_PUBLIC_HA_REDIRECT_URI!

// Optional override: if set, skip OAuth2 (useful for testing)
const LONG_LIVED_TOKEN =
  getImportMetaEnv("VITE_HA_LONG_LIVED_TOKEN") ||
  process.env.NEXT_PUBLIC_HA_LONG_LIVED_TOKEN

const STORAGE_KEY = "ha_tokens"

export type Tokens = {
  access_token: string
  refresh_token?: string
  expires_in?: number // in seconds
  token_type: string
  created_at: number // epoch ms
}

function log(...args: any[]) {
  console.log("[HA AUTH]", ...args)
}

/**
 * Save tokens into localStorage (with created_at timestamp).
 */
export function saveTokens(tokens: any) {
  const data: Tokens = {
    ...tokens,
    created_at: Date.now(),
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  log("Saved tokens to localStorage:", {
    access_token: !!data.access_token,
    refresh_token: !!data.refresh_token,
    expires_in: data.expires_in,
  })
}

/**
 * Load tokens from localStorage.
 */
export function loadTokens(): Tokens | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Tokens) : null
  } catch {
    return null
  }
}

/**
 * Clear stored tokens.
 */
export function clearTokens() {
  localStorage.removeItem(STORAGE_KEY)
  log("Cleared tokens")
}

/**
 * Redirect to Home Assistant OAuth2 login.
 */
export function login() {
  if (LONG_LIVED_TOKEN) {
    log("Using long-lived token; skipping OAuth login")
    return
  }
  const authUrl =
    `${HA_HTTP_URL}/auth/authorize?response_type=code` +
    `&client_id=${encodeURIComponent(CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`
  log("Redirecting to HA login:", authUrl)
  window.location.href = authUrl
}

/**
 * Exchange authorization code for access + refresh tokens.
 */
export async function exchangeCodeForToken(code: string) {
  log("Exchanging code for token")
  const res = await fetch(`${HA_HTTP_URL}/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
    }),
  })

  const text = await res.text()
  if (!res.ok) {
    log("Token exchange failed:", res.status, text)
    throw new Error(`Token exchange failed: ${res.status}`)
  }
  const data = JSON.parse(text)
  saveTokens(data)
  return data as Tokens
}

/**
 * Refresh access token using stored refresh token.
 */
export async function refreshAccessToken() {
  const tokens = loadTokens()
  if (!tokens?.refresh_token) throw new Error("No refresh token available")

  log("Refreshing access token...")
  const res = await fetch(`${HA_HTTP_URL}/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: tokens.refresh_token,
      client_id: CLIENT_ID,
    }),
  })

  const text = await res.text()
  if (!res.ok) {
    log("Refresh failed:", res.status, text)
    throw new Error(`Refresh failed: ${res.status}`)
  }
  const data = JSON.parse(text)
  saveTokens(data)
  log("Refresh successful; new access token saved")
  return data as Tokens
}

/**
 * Get current access token (returns null if expired or missing).
 * WHY: Gracefully handles token expiry without throwing
 * Returns null to allow fallback to refresh/login flow
 */
export function getAccessToken(): string | null {
  // WHY: Prioritize long-lived token if configured (testing/special cases)
  if (LONG_LIVED_TOKEN) return LONG_LIVED_TOKEN

  const t = loadTokens()
  if (!t) return null

  // WHY: If no expiry info, assume token is valid (shouldn't happen)
  if (!t.expires_in) return t.access_token

  // WHY: Calculate absolute expiry time (created_at + duration)
  // Compare with current time to check if expired
  const expiresAt = t.created_at + t.expires_in * 1000
  if (Date.now() >= expiresAt) {
    log("Access token expired")
    return null
  }
  return t.access_token
}

/**
 * Get time (ms) until current access token expires.
 */
export function getTimeToExpiryMs(): number | null {
  const t = loadTokens()
  if (!t?.expires_in) return null
  return t.created_at + t.expires_in * 1000 - Date.now()
}

/**
 * Force a refresh now (useful for debugging).
 */
export async function forceRefreshNow() {
  return refreshAccessToken()
}
