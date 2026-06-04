// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { timingSafeEqual } from "crypto"

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
