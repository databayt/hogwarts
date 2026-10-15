// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * School plan ids follow the public pricing (`saas-marketing/pricing/config.ts`):
 * free (first 100 students), pro (24 SAR / student / year beyond 100),
 * enterprise (1,000+). Rows written before the 2026-10 pricing carry the old
 * ids — `basic`, `premium`, plus the even older `starter`/`trial` — so every
 * reader goes through `normalizePlanType` and never crashes on a legacy value.
 */
export const PLAN_TYPES = ["free", "pro", "enterprise"] as const
export type PlanType = (typeof PLAN_TYPES)[number]

/** Pre-2026-10 ids and what they mean now. `scripts/migrate-plan-types.ts` rewrites them. */
export const LEGACY_PLAN_TYPES: Record<string, PlanType> = {
  basic: "free",
  trial: "free",
  starter: "free",
  hobby: "free",
  premium: "pro",
  professional: "pro",
  ultra: "enterprise",
}

export function normalizePlanType(value: string | null | undefined): PlanType {
  const v = (value ?? "").toLowerCase().trim()
  if ((PLAN_TYPES as readonly string[]).includes(v)) return v as PlanType
  return LEGACY_PLAN_TYPES[v] ?? "free"
}

/** True for a current id or a known legacy id, in any case. */
export function isKnownPlanType(value: string | null | undefined): boolean {
  const v = (value ?? "").toLowerCase().trim()
  return (PLAN_TYPES as readonly string[]).includes(v) || v in LEGACY_PLAN_TYPES
}

/**
 * Every stored spelling that reads as `id` — for `where: { planType: { in } }`
 * filters until the legacy rows are migrated (stored casing is mixed too).
 */
export function storedPlanTypeValues(id: PlanType): string[] {
  const raw = [
    id,
    ...Object.entries(LEGACY_PLAN_TYPES)
      .filter(([, v]) => v === id)
      .map(([k]) => k),
  ]
  return [...raw, ...raw.map((v) => v.toUpperCase())]
}
