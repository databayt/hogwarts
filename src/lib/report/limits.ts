// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Report intake limits — the ONE place both sides read them from.
 *
 * The dialog mirrors these so the submit button only enables when the server
 * will accept the text; the hard filters enforce them. They used to be two
 * literals that drifted (hogwarts enabled submit on any text while the shared
 * schema demanded 30 chars — a short team report drew the success toast and
 * created nothing). Import from here, never restate the numbers.
 *
 * Signed-in reporters get a lower floor than anonymous visitors: an account is
 * already a trust signal, and "قائمة الطلاب فارغة" (18 chars, 3 words) is a
 * perfectly good report from a teammate. Anonymous traffic keeps the stricter
 * bar that kills "test", "asdf", "doesn't work".
 *
 * Pure constants, no imports — safe in the client bundle.
 */

export interface ReportLimits {
  /** Minimum trimmed description length (HF1). */
  minChars: number
  /** Minimum count of distinct meaningful tokens (HF6). */
  minTokens: number
}

export const REPORT_LIMITS = {
  anonymous: { minChars: 30, minTokens: 5 },
  authenticated: { minChars: 10, minTokens: 3 },
  /** Upper bound for everyone (HF2) — paste-bomb / prompt-injection wall. */
  maxChars: 2000,
} as const satisfies {
  anonymous: ReportLimits
  authenticated: ReportLimits
  maxChars: number
}

/** Schema floor: the lowest floor any reporter kind can have. */
export const SCHEMA_MIN_CHARS = Math.min(
  REPORT_LIMITS.anonymous.minChars,
  REPORT_LIMITS.authenticated.minChars
)

export function limitsFor(kind: "anonymous" | "authenticated"): ReportLimits {
  return REPORT_LIMITS[kind]
}
