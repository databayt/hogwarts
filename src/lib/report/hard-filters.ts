// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Hard filters — instant silent-reject triggers that run BEFORE scoring and AI.
 * Each filter is cheap (no network) and fires before the more expensive Haiku call.
 *
 * The pipeline always returns symmetric success to the client (see plan §10),
 * so a silent-reject from here is indistinguishable from a real success to the user.
 *
 * Triggers (plan §1.2; numbers in ./limits.ts):
 *   HF1  description below the reporter's floor  (30 anon / 10 signed-in)
 *   HF2  description > 2000 chars               (paste-bomb)
 *   HF3  anonymous + invalid Turnstile          (bot defense)
 *   HF4  reporter.isSuspended                   (banned user)
 *   HF5  host not in repo allowlist             (spoofed payload)
 *   HF6  unique meaningful tokens below floor   (5 anon / 3 signed-in; "asdf asdf asdf")
 *   HF7  letters < 40% OR non-alpha > 70%       (keyboard mashing)
 *   HF8  Upstash rate-limit bucket says no      (flood defense; checked in adapter)
 *   HF9  self-duplicate within 60 seconds       (the #302/#303/#304 triple-click)
 *   HF10 banned IP/user                          (permanent ban; checked in adapter)
 *
 * Two entry points so the pipeline can run the free checks before it spends a
 * network round-trip:
 *   runPureFilters   — HF1/2/5/6/7: description + URL only, zero I/O
 *   runContextFilters — HF3/4/9/10: need captcha, session, Redis
 * runHardFilters runs both, in the original order, for callers that have
 * everything at hand (tests, the sibling repos).
 */

import { limitsFor, REPORT_LIMITS } from "./limits"
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
  const withText = { ...ctx, description: input.description }
  return (
    runContextFilters(reporter, withText, "identity") ??
    runPureFilters(input, reporter, ctx.hostAllowlist) ??
    runContextFilters(reporter, withText, "history")
  )
}

/**
 * HF1, HF2, HF5, HF6, HF7 — everything decidable from the payload alone.
 * The pipeline runs this BEFORE rate-limit, captcha and Redis so junk never
 * costs a network call.
 */
export function runPureFilters(
  input: ReportInputParsed,
  reporter: ReporterContext,
  hostAllowlist: readonly string[]
): RejectReason | null {
  const limits = limitsFor(reporter.kind)
  const trimmed = input.description.trim()

  // HF1 — too short for this reporter kind. (Zod enforces only the lowest floor.)
  if (trimmed.length < limits.minChars) {
    return {
      code: "HF1_too_short",
      detail: `Description is ${trimmed.length} chars; minimum for ${reporter.kind} is ${limits.minChars}.`,
    }
  }

  // HF2 — too long
  if (input.description.length > REPORT_LIMITS.maxChars) {
    return {
      code: "HF2_too_long",
      detail: `Description is ${input.description.length} chars; maximum is ${REPORT_LIMITS.maxChars}.`,
    }
  }

  // HF5 — host allowlist
  let host = ""
  try {
    host = new URL(input.pageUrl).hostname.toLowerCase()
  } catch {
    return {
      code: "HF5_host_mismatch",
      detail: "Page URL did not parse.",
    }
  }
  if (!hostMatches(host, hostAllowlist)) {
    return {
      code: "HF5_host_mismatch",
      detail: `Host "${host}" is not in the allowlist.`,
    }
  }

  // HF6 — too few unique meaningful tokens. Catches "asdf asdf asdf asdf".
  const meaningfulTokens = uniqueMeaningfulTokens(trimmed)
  if (meaningfulTokens < limits.minTokens) {
    return {
      code: "HF6_few_tokens",
      detail: `Only ${meaningfulTokens} unique meaningful tokens; minimum for ${reporter.kind} is ${limits.minTokens}.`,
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

  return null
}

/**
 * HF3, HF4, HF9, HF10 — the checks that need the reporter's session, the
 * captcha verdict, or the Redis ledgers. `phase` lets the pipeline keep the
 * original precedence (ban + suspension before content, self-duplicate after).
 */
export function runContextFilters(
  reporter: ReporterContext,
  ctx: Pick<
    HardFilterContext,
    "captchaValid" | "isBanned" | "recentSelfSubmissions"
  > & {
    description?: string
  },
  phase: "identity" | "history" | "all" = "all"
): RejectReason | null {
  if (phase !== "history") {
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
  }

  if (phase !== "identity") {
    // HF3 — reject only when captcha was CONFIGURED-but-failed (explicit false).
    // captchaValid === null means "not enforced" (authenticated user, or an
    // adapter with captcha: "optional" and no Turnstile keys) — the report
    // proceeds at degraded trust. Whether a missing key is a bypass or a refusal
    // is the pipeline's call (adapter.captcha), not this filter's.
    if (reporter.kind === "anonymous" && ctx.captchaValid === false) {
      return {
        code: "HF3_no_captcha",
        detail: "Anonymous report failed Turnstile verification.",
      }
    }

    // HF9 — same reporter, similar description, in last 60 seconds. This is the
    // hogwarts #302/#303/#304 case where the user double/triple-clicks Submit.
    if (ctx.description !== undefined) {
      const head = ctx.description.trim().slice(0, 60).toLowerCase()
      if (
        ctx.recentSelfSubmissions.some((prev) => prev.toLowerCase() === head)
      ) {
        return {
          code: "HF9_self_duplicate",
          detail:
            "Same first-60-chars of description submitted within last 60s.",
        }
      }
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
