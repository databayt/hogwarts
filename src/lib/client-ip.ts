// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { headers } from "next/headers"

/**
 * Best-effort client IP for a Server Action (which, unlike a route handler,
 * has no `NextRequest`). Returns "unknown" when nothing is present so callers
 * can still build a stable rate-limit key (all unknowns share one bucket —
 * acceptable for anti-spam).
 *
 * Production sits behind Cloudflare, which overwrites `cf-connecting-ip` at
 * the edge, so it is read first. `x-forwarded-for` is client-controlled at
 * its head (a caller sends any value and the proxy APPENDS the real hop), so
 * its first entry let anyone pick a fresh rate-limit bucket per request; only
 * its last, proxy-appended entry is used.
 */
export async function getClientIp(): Promise<string> {
  const h = await headers()
  return (
    h.get("cf-connecting-ip")?.trim() ||
    h.get("x-forwarded-for")?.split(",").at(-1)?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  )
}
