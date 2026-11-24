// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * One-time app handoff code: the signed-in web page mints it, the Android app
 * trades it for tokens. Only the sha256 hash is stored (Auth.js
 * `VerificationToken`: email = identifier, token = hash), valid 60 seconds.
 */
import { createHash, randomBytes } from "node:crypto"

export const HANDOFF_TTL_MS = 60_000
export const HANDOFF_MAX_LIVE = 5
const PREFIX = "app-handoff:"

export function newHandoffCode(): string {
  return randomBytes(32).toString("base64url")
}

export function hashHandoffCode(code: string): string {
  return createHash("sha256").update(code).digest("hex")
}

export function handoffIdentifier(userId: string, schoolId: string): string {
  return `${PREFIX}${userId}:${schoolId}`
}

/** Inverse of handoffIdentifier; null when it is not a handoff row. */
export function parseHandoffIdentifier(
  identifier: string
): { userId: string; schoolId: string } | null {
  if (!identifier.startsWith(PREFIX)) return null
  const [userId, schoolId, ...rest] = identifier.slice(PREFIX.length).split(":")
  if (!userId || !schoolId || rest.length) return null
  return { userId, schoolId }
}
