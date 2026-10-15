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

const LEGACY: Record<string, PlanType> = {
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
  return LEGACY[v] ?? "free"
}
