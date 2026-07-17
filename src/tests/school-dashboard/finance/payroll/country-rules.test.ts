// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import {
  calculateProgressiveTax,
  TAX_BRACKETS,
} from "@/components/school-dashboard/finance/payroll/config"
import {
  COUNTRY_PAYROLL_RULE_PACKS,
  resolvePayrollPolicy,
} from "@/components/school-dashboard/finance/payroll/country-rules/registry"

const SD_PACK = COUNTRY_PAYROLL_RULE_PACKS.find((p) => p.country === "SD")!
const AE_PACK = COUNTRY_PAYROLL_RULE_PACKS.find((p) => p.country === "AE")!

describe("payroll country rules — registry", () => {
  it("SD pack brackets stay in lockstep with config.TAX_BRACKETS (drift guard)", () => {
    // The two are intentionally separate (no import cycle); this test is what
    // keeps them from silently diverging.
    expect(SD_PACK.taxBrackets).toEqual([...TAX_BRACKETS])
  })

  it("AE levies no personal income tax", () => {
    expect(AE_PACK.taxBrackets).toEqual([{ from: 0, to: null, rate: 0 }])
    expect(calculateProgressiveTax(250_000, AE_PACK.taxBrackets)).toBe(0)
  })
})

describe("resolvePayrollPolicy — auto-provision from location, fail-safe", () => {
  it("a Sudan school gets the Sudan pack (pilot: no behaviour change)", () => {
    const policy = resolvePayrollPolicy({ country: "SD", currency: "SDG" })
    expect(policy.country).toBe("SD")
    expect(policy.isFailSafeDefault).toBe(false)
    // Same tax the pilot was already paying before country rules existed.
    expect(calculateProgressiveTax(120_000, policy.taxBrackets)).toBe(
      calculateProgressiveTax(120_000, [...TAX_BRACKETS])
    )
    expect(policy.socialSecurityEmployeeRate).toBe(7)
  })

  it("a UAE school is taxed by UAE rules (0%), NOT Sudan's — the headline fix", () => {
    const policy = resolvePayrollPolicy({ country: "AE", currency: "AED" })
    expect(policy.country).toBe("AE")
    expect(policy.isFailSafeDefault).toBe(false)
    expect(calculateProgressiveTax(250_000, policy.taxBrackets)).toBe(0)
    // Prove it differs from the old global-Sudan behaviour it replaces.
    expect(calculateProgressiveTax(250_000, [...TAX_BRACKETS])).toBeGreaterThan(
      0
    )
  })

  it("resolves from timezone/currency when country is absent", () => {
    expect(resolvePayrollPolicy({ timezone: "Asia/Dubai" }).country).toBe("AE")
    expect(resolvePayrollPolicy({ currency: "SDG" }).country).toBe("SD")
  })

  it("an unresolvable school gets the fail-safe pack — flagged, zero withholding", () => {
    const policy = resolvePayrollPolicy({ currency: "USD" })
    expect(policy.country).toBeNull()
    expect(policy.isFailSafeDefault).toBe(true)
    expect(calculateProgressiveTax(500_000, policy.taxBrackets)).toBe(0)
    expect(policy.socialSecurityEmployeeRate).toBe(0)
  })

  it("a resolved country with no pack yet still fails safe (not another country's rates)", () => {
    // GB resolves as a country but has no pack → fail-safe, never SD's brackets.
    const policy = resolvePayrollPolicy({ country: "GB" })
    expect(policy.country).toBe("GB")
    expect(policy.isFailSafeDefault).toBe(true)
    expect(calculateProgressiveTax(250_000, policy.taxBrackets)).toBe(0)
  })

  it("a per-school override wins over the country pack", () => {
    const policy = resolvePayrollPolicy(
      { country: "SD" },
      { socialSecurityEmployeeRate: 5 }
    )
    expect(policy.country).toBe("SD")
    expect(policy.socialSecurityEmployeeRate).toBe(5) // overridden
    expect(policy.taxBrackets).toEqual(SD_PACK.taxBrackets) // untouched
  })

  it("countryOverride forces a different pack than location would pick", () => {
    const policy = resolvePayrollPolicy(
      { country: "SD" },
      { countryOverride: "AE" }
    )
    expect(policy.country).toBe("AE")
    expect(calculateProgressiveTax(250_000, policy.taxBrackets)).toBe(0)
  })
})
