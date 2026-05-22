// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Service-account API token verification.
//
// Token shape: <prefix>.<secret> where prefix is 8 chars and stored
// plaintext for fast lookup, full plaintext is bcrypt-hashed in tokenHash.
//
// Issuance flow (out of scope of this file): generate prefix + secret,
// bcrypt the full plaintext, store hash + prefix in school_api_tokens.
// Plaintext is returned ONCE to the issuer.

import { randomBytes } from "crypto"
import bcrypt from "bcryptjs"

import { db } from "@/lib/db"

const PREFIX_MIN_LEN = 4
const PREFIX_LEN = 8

export interface GeneratedApiToken {
  /** Full `<prefix>.<secret>` — returned ONCE; never recoverable after. */
  plaintext: string
  /** First 8 chars, persisted for fast indexed lookup. */
  tokenPrefix: string
  /** bcrypt hash of the full plaintext, persisted in `tokenHash`. */
  tokenHash: string
}

/**
 * Generate a fresh service-account API token. Persist only `tokenPrefix` +
 * `tokenHash`; show `plaintext` to the issuer once (it cannot be recovered).
 */
export async function generateApiToken(): Promise<GeneratedApiToken> {
  const rawPrefix = randomBytes(4).toString("hex") // 8 hex chars
  const secret = randomBytes(24).toString("hex") // 48 hex chars
  const plaintext = `${rawPrefix}.${secret}`
  const tokenPrefix = plaintext.slice(0, PREFIX_LEN) // === rawPrefix
  const tokenHash = await bcrypt.hash(plaintext, 10)
  return { plaintext, tokenPrefix, tokenHash }
}

export interface VerifiedApiToken {
  id: string
  schoolId: string
  scopes: string[]
}

export type VerifyResult =
  | { ok: true; token: VerifiedApiToken }
  | {
      ok: false
      reason: "MISSING_API_TOKEN" | "INVALID_API_TOKEN" | "INSUFFICIENT_SCOPE"
    }

/**
 * Verify a `<prefix>.<secret>` bearer token. Returns the resolved schoolId +
 * scopes on success. Updates `lastUsedAt` fire-and-forget.
 *
 * @param plaintext bearer token from Authorization header
 * @param requiredScope scope name the caller needs (e.g. "transportation.geofence_boarding")
 */
export async function verifyApiToken(
  plaintext: string,
  requiredScope: string
): Promise<VerifyResult> {
  if (!plaintext) return { ok: false, reason: "MISSING_API_TOKEN" }

  const dot = plaintext.indexOf(".")
  if (dot < PREFIX_MIN_LEN) return { ok: false, reason: "INVALID_API_TOKEN" }

  const prefix = plaintext.slice(0, PREFIX_LEN)

  const candidates = await db.schoolApiToken
    .findMany({
      where: { tokenPrefix: prefix, deletedAt: null },
      select: {
        id: true,
        schoolId: true,
        tokenHash: true,
        scopes: true,
      },
    })
    .catch(() => [])

  for (const c of candidates) {
    let matches = false
    try {
      matches = await bcrypt.compare(plaintext, c.tokenHash)
    } catch {
      matches = false
    }
    if (!matches) continue

    if (!c.scopes.includes(requiredScope)) {
      return { ok: false, reason: "INSUFFICIENT_SCOPE" }
    }

    // fire-and-forget last-used update
    void db.schoolApiToken
      .update({
        where: { id: c.id },
        data: { lastUsedAt: new Date() },
      })
      .catch(() => {})

    return {
      ok: true,
      token: { id: c.id, schoolId: c.schoolId, scopes: c.scopes },
    }
  }

  return { ok: false, reason: "INVALID_API_TOKEN" }
}
