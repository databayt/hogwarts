// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { compare } from "bcryptjs"

import { toAsciiDigits } from "@/lib/ascii-digits"

/**
 * Compare a typed password against a bcrypt hash. Arabic-keyboard digits are
 * read as ASCII first; if that fails, the raw string is tried too, since a PIN
 * set in Arabic digits before the fold existed is hashed as typed.
 */
export async function passwordMatches(
  candidate: string,
  hash: string
): Promise<boolean> {
  const ascii = toAsciiDigits(candidate)
  if (await compare(ascii, hash)) return true
  return ascii !== candidate ? compare(candidate, hash) : false
}
