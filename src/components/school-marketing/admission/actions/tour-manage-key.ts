// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The capability behind a tour booking's "Manage Booking" link.
 *
 * Booking numbers are guessable (TB-<6 chars>, printed on screen, read over
 * the phone), so they cannot also be the key that cancels or reschedules a
 * family's tour. The confirmation email carries `?k=<HMAC(booking id)>`;
 * cancel / reschedule require it. Nothing is stored — the key is derived.
 */

import "server-only"

import { createHmac, timingSafeEqual } from "node:crypto"

function secret(): string {
  const s = process.env.AUTH_SECRET
  if (!s) throw new Error("AUTH_SECRET is required for tour manage keys")
  return s
}

export function tourManageKey(bookingId: string): string {
  return createHmac("sha256", secret())
    .update(`tour-manage:${bookingId}`)
    .digest("base64url")
    .slice(0, 32)
}

export function verifyTourManageKey(
  bookingId: string,
  key: string | null | undefined
): boolean {
  if (!key) return false
  const a = Buffer.from(tourManageKey(bookingId))
  const b = Buffer.from(key)
  return a.length === b.length && timingSafeEqual(a, b)
}
