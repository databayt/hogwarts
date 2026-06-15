// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Credential generation primitives — shared by every path that mints login
 * credentials for a user (admin per-student dialog, admin per-member reset,
 * bulk CSV import). Centralised so the security properties hold everywhere:
 *
 * - Passwords are CRYPTOGRAPHICALLY random (crypto.randomInt, never Math.random)
 *   and unrelated to the username/name, so a temp password can never be guessed
 *   from public data (the student code is visible; the password must not be).
 * - Usernames are LOGIN-VALID by construction: the credentials login schema
 *   (USERNAME_LOGIN_RE in components/auth/validation.ts) only accepts
 *   `[A-Za-z0-9._-]{3,64}` — names with spaces or Arabic script are rejected,
 *   which previously locked CSV-imported teachers/guardians out entirely.
 *
 * bcrypt remains the hashing scheme everywhere (verified at login in
 * auth.config.ts). `mintTempPassword` returns both the plaintext (to deliver
 * to the user once) and the bcrypt hash (to store).
 */

import crypto from "node:crypto"

// Unambiguous alphabet — excludes 0/O, 1/l/I so a delivered temp password can
// be read aloud / typed without confusion, while staying high-entropy.
const TEMP_PASSWORD_ALPHABET =
  "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"

const DEFAULT_PASSWORD_LENGTH = 12

/**
 * Generate a cryptographically-secure, human-typeable temporary password.
 * Default length 12 over a 55-char alphabet ≈ 69 bits of entropy — safe even
 * before `mustChangePassword` forces a rotation on first login.
 */
export function generateTempPassword(
  length: number = DEFAULT_PASSWORD_LENGTH
): string {
  const len = Math.max(8, length)
  const n = TEMP_PASSWORD_ALPHABET.length
  let out = ""
  for (let i = 0; i < len; i++) {
    // crypto.randomInt(0, n) is uniform (no modulo bias).
    out += TEMP_PASSWORD_ALPHABET[crypto.randomInt(0, n)]
  }
  return out
}

/**
 * Mint a fresh temp password: returns the plaintext (deliver once) and its
 * bcrypt hash (store on User.password). Default cost 10 matches the login
 * verification path; bulk importers may pass a lower cost for throughput.
 */
export async function mintTempPassword(
  rounds: number = 10
): Promise<{ plain: string; hashed: string }> {
  const { hash } = await import("bcryptjs")
  const plain = generateTempPassword()
  const hashed = await hash(plain, rounds)
  return { plain, hashed }
}

/**
 * Reduce an arbitrary string (a name, an employee id, a free-form handle) to a
 * login-valid username base, or "" when nothing usable remains (e.g. a purely
 * Arabic name — callers fall back to a generated code via makeUniqueUsername).
 */
export function sanitizeUsername(base: string | null | undefined): string {
  const s = (base ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9._-]+/g, ".") // any invalid run → single separator
    .replace(/\.{2,}/g, ".")
    .replace(/^[._-]+|[._-]+$/g, "")
  return s.length >= 3 ? s.slice(0, 64) : ""
}

/**
 * Produce a login-valid username that is unique within `taken` (a Set of
 * already-used usernames the caller maintains — preload existing rows plus
 * everything generated so far in the same batch). Falls back to a random
 * role-prefixed code when the base can't be sanitised (non-Latin names).
 * The chosen username is added to `taken` before returning.
 */
export function makeUniqueUsername(
  base: string | null | undefined,
  taken: Set<string>,
  fallbackPrefix: string = "u"
): string {
  const candidate =
    sanitizeUsername(base) ||
    `${fallbackPrefix}${crypto.randomInt(100_000, 1_000_000)}`
  let unique = candidate
  let i = 1
  while (taken.has(unique)) {
    unique = `${candidate}.${i}`.slice(0, 64)
    i++
  }
  taken.add(unique)
  return unique
}

/** SHA-256 hex of a token — store this at rest so a DB read can't replay a
 *  live reset/verification token. The raw token still travels in the email. */
export function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex")
}
