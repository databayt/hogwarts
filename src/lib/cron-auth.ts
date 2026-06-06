// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { timingSafeEqual } from "node:crypto"

/**
 * Shared cron-secret verification for `/api/cron/*` routes.
 *
 * Fails CLOSED: when `CRON_SECRET` is unset we refuse every request in all
 * environments, instead of comparing against the string `Bearer undefined`.
 * The previous bare check —
 *   `if (authHeader !== \`Bearer ${process.env.CRON_SECRET}\`)`
 * — accepted a request carrying `Authorization: Bearer undefined` whenever the
 * env var was missing, turning these notification/report cron endpoints into
 * unauthenticated triggers. Uses a constant-time compare to avoid timing leaks.
 *
 * Accepts the base `Request` type so it works for both `Request` and
 * `NextRequest` route handlers.
 */
export function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error(
      "[cron-auth] CRON_SECRET is not set — refusing cron request (fail-closed)"
    )
    return false
  }

  const authHeader = request.headers.get("authorization") ?? ""
  const provided = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : ""

  const a = Buffer.from(provided)
  const b = Buffer.from(secret)
  // timingSafeEqual throws on length mismatch — short-circuit first.
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

/**
 * Constant-time Bearer-token check for Vercel cron routes (route-name variant).
 *
 * Mirrors the hardened pattern in `process-whatsapp-notifications/route.ts`.
 * Fails closed in production if `CRON_SECRET` is unset; allows requests in
 * dev so localhost cron testing works without env vars. Used by the cron
 * routes restored with the compliance/conference bundle.
 *
 * `timingSafeEqual` needs equal-length buffers — length mismatch short-circuits.
 */
export function isAuthorizedCron(request: Request, routeName: string): boolean {
  const expected = process.env.CRON_SECRET
  if (!expected) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        `[cron/${routeName}] CRON_SECRET unset in production — refusing`
      )
      return false
    }
    return true
  }

  const header = request.headers.get("authorization") ?? ""
  if (!header.startsWith("Bearer ")) return false
  const token = header.slice("Bearer ".length)
  if (token.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(token), Buffer.from(expected))
}
