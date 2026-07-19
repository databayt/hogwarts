// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import { db } from "@/lib/db"
import type { SchoolLocationFields } from "@/lib/school-country"

import {
  resolvePayrollPolicy,
  type ResolvedPayrollPolicy,
  type TaxBracket,
} from "./registry"

/**
 * Load a school's saved payroll override (SchoolPayrollPolicy) as the shape
 * resolvePayrollPolicy expects, or undefined when the school has none (defaults
 * come purely from its country pack).
 */
export async function loadPayrollOverride(schoolId: string): Promise<
  | {
      countryOverride?: string | null
      taxBrackets?: TaxBracket[]
      socialSecurityEmployeeRate?: number
      socialSecurityEmployerRate?: number
    }
  | undefined
> {
  // This table is a late-additive migration. If the code deploys ahead of the
  // migration, an absent table must degrade to "no override" (inherit the
  // country pack) rather than throw and break every payroll/salary run — the
  // two hot paths that call this. A missing row and a missing table are the
  // same semantics here: no override exists.
  let row
  try {
    row = await db.schoolPayrollPolicy.findUnique({ where: { schoolId } })
  } catch (err) {
    const code = (err as { code?: string })?.code
    if (code === "P2021" || code === "P2022") return undefined // table/column absent
    throw err
  }
  if (!row) return undefined
  return {
    countryOverride: row.countryOverride ?? undefined,
    taxBrackets: (row.taxBrackets as TaxBracket[] | null) ?? undefined,
    socialSecurityEmployeeRate:
      row.socialSecurityEmployeeRate != null
        ? Number(row.socialSecurityEmployeeRate)
        : undefined,
    socialSecurityEmployerRate:
      row.socialSecurityEmployerRate != null
        ? Number(row.socialSecurityEmployerRate)
        : undefined,
  }
}

/**
 * Resolve a school's effective payroll policy: its country pack (auto-provisioned
 * from location) with any saved per-school override layered on top. This is the
 * single entry point payroll/salary use so the override is honoured everywhere.
 */
export async function resolveSchoolPayrollPolicy(
  schoolId: string,
  school: SchoolLocationFields
): Promise<ResolvedPayrollPolicy> {
  const override = await loadPayrollOverride(schoolId)
  return resolvePayrollPolicy(school, override)
}
