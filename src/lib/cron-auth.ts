// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { timingSafeEqual } from "node:crypto"

/**
 * Constant-time Bearer-token check for Vercel cron routes.
 *
 * Mirrors the hardened pattern in `process-whatsapp-notifications/route.ts`.
 * Fails closed in production if `CRON_SECRET` is unset; allows requests in
 * dev so localhost cron testing works without env vars.
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
