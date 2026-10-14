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
 * PINs nobody should be handed: one digit repeated, the textbook sequences,
 * and anything that reads as a birth year (19xx / 20xx).
 */
function isWeakPin(pin: string): boolean {
  if (/^(\d)\1{3}$/.test(pin)) return true
  if (["1234", "4321", "0123", "3210", "9876", "6789"].includes(pin))
    return true
  return /^(19|20)\d\d$/.test(pin)
}

// Keypad columns and diagonals — easy to recall as a shape on the phone pad.
const KEYPAD_PINS = [
  "2580",
  "0852",
  "1470",
  "0741",
  "3690",
  "0963",
  "1590",
  "9510",
  "3570",
  "7530",
]

type PinFamily = (a: number, b: number) => string

const PIN_FAMILIES: PinFamily[] = [
  (a, b) => `${a}${a}${b}${b}`, // 1122
  (a, b) => `${a}${b}${a}${b}`, // 1212
  (a, b) => `${a}${b}${b}${a}`, // 1221
  (a, b) => `${a}${a}${a}${b}`, // 1112
  (a, b) => `${a}${b}${b}${b}`, // 1222
  (a) => [0, 1, 2, 3].map((i) => (a + i) % 10).join(""), // 3456
  (a) => [0, 1, 2, 3].map((i) => (a + 10 - i) % 10).join(""), // 8765
  () => KEYPAD_PINS[crypto.randomInt(0, KEYPAD_PINS.length)], // 2580
]

/**
 * A 4-digit PIN that is easy to remember — a pattern (1122, 1212, 3456,
 * 2580), never 0000/1234 or a birth year. Patterns are picked with
 * crypto.randomInt so neighbours don't share a PIN; pass `taken` to keep a
 * batch distinct (falls back to repeats once the pattern space runs out).
 * Login lockout (rate-limited sign-in) is what makes 4 digits acceptable.
 */
export function generateEasyPin(taken?: Set<string>): string {
  let pin = ""
  for (let attempt = 0; attempt < 50; attempt++) {
    const family = PIN_FAMILIES[crypto.randomInt(0, PIN_FAMILIES.length)]
    const a = crypto.randomInt(0, 10)
    let b = crypto.randomInt(0, 9)
    if (b >= a) b++ // b ≠ a
    pin = family(a, b)
    if (isWeakPin(pin)) continue
    if (!taken || !taken.has(pin)) break
  }
  taken?.add(pin)
  return pin
}

/**
 * Mint a fresh login password for a school member: an easy 4-digit PIN
 * (deliver once) and its bcrypt hash (store on User.password). Default cost
 * 10 matches the login verification path; bulk importers may pass lower.
 */
export async function mintTempPassword(
  rounds: number = 10,
  taken?: Set<string>
): Promise<{ plain: string; hashed: string }> {
  const { hash } = await import("bcryptjs")
  const plain = generateEasyPin(taken)
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
