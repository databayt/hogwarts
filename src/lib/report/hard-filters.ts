// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Hard filters — instant silent-reject triggers that run BEFORE scoring and AI.
 * Each filter is cheap (no network) and fires before the more expensive Haiku call.
 *
 * The pipeline always returns symmetric success to the client (see plan §10),
 * so a silent-reject from here is indistinguishable from a real success to the user.
 *
 * Triggers (plan §1.2):
 *   HF1  description < 30 chars                 ("tests", "asdf", "doesn't work")
 *   HF2  description > 2000 chars               (paste-bomb)
 *   HF3  anonymous + invalid Turnstile          (bot defense)
 *   HF4  reporter.isSuspended                   (banned user)
 *   HF5  host not in repo allowlist             (spoofed payload)
 *   HF6  unique meaningful tokens < 5           ("asdf asdf asdf asdf")
 *   HF7  letters < 40% OR non-alpha > 70%       (keyboard mashing)
 *   HF8  Upstash rate-limit bucket says no      (flood defense; checked in adapter)
 *   HF9  self-duplicate within 60 seconds       (the #302/#303/#304 triple-click)
 *   HF10 banned IP/user                          (permanent ban; checked in adapter)
 */

import type { ReportInputParsed } from "./schema"
import type { RejectReason, ReporterContext } from "./types"

export interface HardFilterContext {
  hostAllowlist: string[]
  recentSelfSubmissions: string[] // first-60-chars of descriptions in last 60s for this reporter
  captchaValid: boolean | null // null if not needed, true/false otherwise
  isBanned: boolean
}

/**
 * Runs all hard filters except HF8 (which lives in the adapter's checkRateLimit
 * because it needs Upstash). Returns the first failing reason, or null if all pass.
 */
export function runHardFilters(
  input: ReportInputParsed,
  reporter: ReporterContext,
  ctx: HardFilterContext
): RejectReason | null {
  // HF10 — banned identifier first (cheapest, ends conversation)
  if (ctx.isBanned) {
    return {
      code: "HF10_banned",
      detail: "Identifier is on the report ban list.",
    }
  }

  // HF4 — suspended account
  if (reporter.kind === "authenticated" && reporter.isSuspended) {
    return {
      code: "HF4_suspended",
      detail: "Reporter account is suspended.",
    }
  }

  const trimmed = input.description.trim()

  // HF1 — too short. (Zod also rejects but we re-check after trim.)
  if (trimmed.length < 30) {
    return {
      code: "HF1_too_short",
      detail: `Description is ${trimmed.length} chars; minimum is 30.`,
    }
  }

  // HF2 — too long
  if (input.description.length > 2000) {
    return {
      code: "HF2_too_long",
      detail: `Description is ${input.description.length} chars; maximum is 2000.`,
    }
  }

  // HF3 — reject only when captcha was CONFIGURED-but-failed (explicit false).
  // When captchaValid is null (Turnstile not enforced: authenticated user, or a
  // deployment with no Turnstile keys) the report proceeds at degraded trust —
  // a missing env var must never silently eat a legit report.
  if (reporter.kind === "anonymous" && ctx.captchaValid === false) {
    return {
      code: "HF3_no_captcha",
      detail: "Anonymous report failed Turnstile verification.",
    }
  }

  // HF5 — host allowlist
  let host = ""
  try {
    host = new URL(input.pageUrl).host.toLowerCase()
  } catch {
    return {
      code: "HF5_host_mismatch",
      detail: "Page URL did not parse.",
    }
  }
  if (!hostMatches(host, ctx.hostAllowlist)) {
    return {
      code: "HF5_host_mismatch",
      detail: `Host "${host}" is not in the allowlist.`,
    }
  }

  // HF6 — unique meaningful tokens < 5. Catches "asdf asdf asdf asdf".
  const meaningfulTokens = uniqueMeaningfulTokens(trimmed)
  if (meaningfulTokens < 5) {
    return {
      code: "HF6_few_tokens",
      detail: `Only ${meaningfulTokens} unique meaningful tokens.`,
    }
  }

  // HF7 — character-class ratio. Counts Arabic + Latin letters as letters.
  const ratio = letterRatio(trimmed)
  if (ratio.letters < 0.4 || ratio.nonAlpha > 0.7) {
    return {
      code: "HF7_gibberish",
      detail: `letters=${ratio.letters.toFixed(2)}, nonAlpha=${ratio.nonAlpha.toFixed(2)}`,
    }
  }

  // HF9 — same reporter, similar description, in last 60 seconds. This is the
  // hogwarts #302/#303/#304 case where the user double/triple-clicks Submit.
  const head = trimmed.slice(0, 60).toLowerCase()
  if (ctx.recentSelfSubmissions.some((prev) => prev.toLowerCase() === head)) {
    return {
      code: "HF9_self_duplicate",
      detail: "Same first-60-chars of description submitted within last 60s.",
    }
  }

  return null
}

/**
 * Match host against allowlist entries. Entries can be exact (`localhost`) or
 * wildcard (`*.databayt.org`).
 */
export function hostMatches(
  host: string,
  allowlist: readonly string[]
): boolean {
  return allowlist.some((entry) => {
    const normalized = entry.toLowerCase()
    if (normalized.startsWith("*.")) {
      const suffix = normalized.slice(1) // ".databayt.org"
      return host === suffix.slice(1) || host.endsWith(suffix)
    }
    return host === normalized
  })
}

/**
 * Count tokens that look like real words. Drops < 2 char tokens, dedups,
 * normalizes case + Arabic diacritics.
 */
export function uniqueMeaningfulTokens(text: string): number {
  const tokens = text
    .toLowerCase()
    .replace(/[ً-ٰٟ]/g, "") // Arabic diacritics
    .split(/[\s\p{P}]+/u) // unicode whitespace + punctuation
    .filter((t) => t.length >= 2)
  return new Set(tokens).size
}

/**
 * Ratio of letters (any Unicode letter incl. Arabic) vs total non-space chars.
 */
export function letterRatio(text: string): {
  letters: number
  nonAlpha: number
} {
  const nonSpace = text.replace(/\s/g, "")
  if (nonSpace.length === 0) return { letters: 0, nonAlpha: 1 }
  const letters = nonSpace.match(/\p{L}/gu)?.length ?? 0
  const digits = nonSpace.match(/\p{N}/gu)?.length ?? 0
  return {
    letters: letters / nonSpace.length,
    nonAlpha: (nonSpace.length - letters - digits) / nonSpace.length,
  }
}
