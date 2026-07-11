// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { headers } from "next/headers"

/**
 * Best-effort client IP for a Server Action (which, unlike a route handler,
 * has no `NextRequest`). Reads the standard forwarding headers. Returns
 * "unknown" when none are present so callers can still build a stable
 * rate-limit key (all unknowns share one bucket — acceptable for anti-spam).
 */
export async function getClientIp(): Promise<string> {
  const h = await headers()
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    h.get("cf-connecting-ip") ||
    "unknown"
  )
}
