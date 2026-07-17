// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Per-country payroll statutory rules (income-tax brackets, social-security
 * rates). These are LAW, so they live in code — versioned with the app,
 * reviewable in a diff, and unit-tested. Rules default from the school's
 * resolved country; a per-school override layers on top (see resolvePayrollPolicy).
 *
 * Adding a country = append a pack here + a test. Rates flagged below need an
 * accountant's sign-off before they're trusted for a new market.
 */

import {
  resolveSchoolCountry,
  type SchoolLocationFields,
} from "@/lib/school-country"

export interface TaxBracket {
  /** Lower bound (inclusive), in WHOLE currency units. */
  from: number
  /** Upper bound (exclusive), or null for the open-ended top bracket. */
  to: number | null
  /** Marginal rate as a percentage (e.g. 10 = 10%). */
  rate: number
}

export interface PayrollRulePack {
  /** ISO-3166 alpha-2, or "*" for the fail-safe default. */
  country: string
  taxBrackets: TaxBracket[]
  socialSecurityEmployeeRate: number
  socialSecurityEmployerRate: number
  /** True only for the "*" pack — signals "no real country rules applied". */
  isFailSafeDefault: boolean
  /** Citation / provenance for audit; names the law and year where known. */
  sourceNote: string
}

/**
 * The fail-safe pack. Applied when a school's country can't be resolved, or has
 * no pack yet. Withholds NOTHING — never another country's rates — and is
 * flagged so the UI can tell the admin to configure real rules.
 */
const FAIL_SAFE_PACK: PayrollRulePack = {
  country: "*",
  taxBrackets: [{ from: 0, to: null, rate: 0 }],
  socialSecurityEmployeeRate: 0,
  socialSecurityEmployerRate: 0,
  isFailSafeDefault: true,
  sourceNote:
    "Fail-safe default — no country-specific payroll rules configured; zero statutory withholding.",
}

export const COUNTRY_PAYROLL_RULE_PACKS: PayrollRulePack[] = [
  {
    country: "SD",
    // Sudan progressive monthly income tax + social insurance. Ported from the
    // former global TAX_BRACKETS / SOCIAL_SECURITY_RATE constants.
    // TODO(accountant): confirm current Sudanese statutory brackets & rates.
    taxBrackets: [
      { from: 0, to: 20000, rate: 0 },
      { from: 20000, to: 50000, rate: 10 },
      { from: 50000, to: 100000, rate: 15 },
      { from: 100000, to: 200000, rate: 20 },
      { from: 200000, to: null, rate: 25 },
    ],
    socialSecurityEmployeeRate: 7,
    socialSecurityEmployerRate: 12,
    isFailSafeDefault: false,
    sourceNote: "Sudan — ported from legacy global TAX_BRACKETS (pre-2026-07).",
  },
  {
    country: "AE",
    // UAE levies NO personal income tax. Social security (GPSSA pension) applies
    // only to GCC nationals, which the platform has no per-employee field for —
    // so the default pack withholds 0 and this is documented, not guessed.
    taxBrackets: [{ from: 0, to: null, rate: 0 }],
    socialSecurityEmployeeRate: 0,
    socialSecurityEmployerRate: 0,
    isFailSafeDefault: false,
    sourceNote:
      "UAE — no personal income tax; GPSSA pension is nationality-conditional and not modelled per-employee.",
  },
]

const PACK_BY_COUNTRY: Record<string, PayrollRulePack> = Object.fromEntries(
  COUNTRY_PAYROLL_RULE_PACKS.map((p) => [p.country, p])
)

export interface ResolvedPayrollPolicy {
  /** Resolved ISO-2, or null when the school's location gave no country. */
  country: string | null
  taxBrackets: TaxBracket[]
  socialSecurityEmployeeRate: number
  socialSecurityEmployerRate: number
  /** True when the fail-safe pack was used (unresolved country or no pack). */
  isFailSafeDefault: boolean
}

/**
 * Resolve the statutory payroll rules that apply to a school, defaulting from
 * its location. Returns the fail-safe (zero-withholding, flagged) pack rather
 * than guessing when the country is unknown or unsupported.
 *
 * `override` is the per-school adjustment (see SchoolPayrollPolicy): any field
 * set on it wins over the country pack, so a school can tune rates without
 * forking a country's law.
 */
export function resolvePayrollPolicy(
  school: SchoolLocationFields,
  override?: Partial<
    Omit<ResolvedPayrollPolicy, "country" | "isFailSafeDefault">
  > & { countryOverride?: string | null }
): ResolvedPayrollPolicy {
  const resolvedCountry = override?.countryOverride
    ? override.countryOverride.toUpperCase()
    : resolveSchoolCountry(school)

  const pack =
    (resolvedCountry && PACK_BY_COUNTRY[resolvedCountry]) || FAIL_SAFE_PACK

  return {
    country: resolvedCountry,
    taxBrackets: override?.taxBrackets ?? pack.taxBrackets,
    socialSecurityEmployeeRate:
      override?.socialSecurityEmployeeRate ?? pack.socialSecurityEmployeeRate,
    socialSecurityEmployerRate:
      override?.socialSecurityEmployerRate ?? pack.socialSecurityEmployerRate,
    isFailSafeDefault: pack.isFailSafeDefault,
  }
}
