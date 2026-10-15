// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The one definition of "at risk" for attendance. Client-safe (no db).
 *
 * Every risk surface — the students list (early-warning), support tiers,
 * letters and the predictions baseline — classifies through `riskBand`, so
 * their counts agree. The server half (`./queries.ts`) rolls attendance rows
 * up to school days and applies these rules.
 *
 * Thresholds (attendance rate over the last RISK_WINDOW_DAYS, LATE counts as
 * attended, EXCUSED/SICK count as missed, HOLIDAY is ignored):
 *
 *   rate <  80%        critical  → Tier 3 (intensive)
 *   80% ≤ rate < 90%   high      → Tier 2 (targeted)   — chronic absence = ≥10% missed
 *   90% ≤ rate < 95%   moderate  → Tier 1 (watch)
 *   rate ≥ 95%         ok        → not at risk
 *
 * A student with fewer than MIN_RECORDED_DAYS recorded school days in the
 * window is "insufficient": never flagged, so one absence on a near-empty
 * record no longer reads as "0% attendance".
 */

export const RISK_WINDOW_DAYS = 90
export const MIN_RECORDED_DAYS = 5
export const RISK_PAGE_SIZE = 25

export const RISK_THRESHOLDS = {
  /** Below this rate → critical. */
  critical: 80,
  /** Below this rate → high. */
  high: 90,
  /** Below this rate → moderate. */
  moderate: 95,
} as const

export type RiskBand = "critical" | "high" | "moderate" | "ok"
export type AtRiskBand = Exclude<RiskBand, "ok">
export type RiskTier = "TIER_1" | "TIER_2" | "TIER_3"

export const AT_RISK_BANDS: AtRiskBand[] = ["critical", "high", "moderate"]

export function riskBand(rate: number): RiskBand {
  if (rate < RISK_THRESHOLDS.critical) return "critical"
  if (rate < RISK_THRESHOLDS.high) return "high"
  if (rate < RISK_THRESHOLDS.moderate) return "moderate"
  return "ok"
}

export function bandTier(band: AtRiskBand): RiskTier {
  return band === "critical" ? "TIER_3" : band === "high" ? "TIER_2" : "TIER_1"
}

export function tierBand(tier: RiskTier): AtRiskBand {
  return tier === "TIER_3"
    ? "critical"
    : tier === "TIER_2"
      ? "high"
      : "moderate"
}

/** Legacy enum still returned by older actions (interventions table). */
export type LegacyRiskLevel =
  | "SATISFACTORY"
  | "AT_RISK"
  | "MODERATELY_CHRONIC"
  | "SEVERELY_CHRONIC"

export function legacyBand(level: string): RiskBand {
  switch (level) {
    case "SEVERELY_CHRONIC":
      return "critical"
    case "MODERATELY_CHRONIC":
      return "high"
    case "AT_RISK":
      return "moderate"
    default:
      return "ok"
  }
}

/** Quiet tone per band: a dot colour + a soft badge. */
export const BAND_TONE: Record<RiskBand, { dot: string; badge: string }> = {
  critical: {
    dot: "bg-red-500",
    badge: "bg-red-500/10 text-red-700 dark:text-red-400",
  },
  high: {
    dot: "bg-orange-500",
    badge: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  },
  moderate: {
    dot: "bg-amber-400",
    badge: "bg-amber-400/15 text-amber-700 dark:text-amber-400",
  },
  ok: {
    dot: "bg-emerald-500",
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
}

/** "87.5%" — Latin digits in both languages. */
export function formatRate(n: number, lang: string): string {
  return (
    new Intl.NumberFormat(lang === "ar" ? "ar-SA" : "en-US", {
      numberingSystem: "latn",
      maximumFractionDigits: 1,
    }).format(n) + "%"
  )
}
