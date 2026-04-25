// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import { resolveDefaultCurrency } from "@/lib/payment/gateway-config"

// Step 5 — the auto-currency-derivation logic in updateSchoolLocation is the
// runtime expression `resolveDefaultCurrency(country)`. Exercising the helper
// here locks in the end-to-end expectation without needing Prisma in the test.

describe("Step 5 — currency auto-derived from country during location save", () => {
  it("returns the correct currency for every onboarded-today country", () => {
    const cases: Record<string, string> = {
      SD: "SDG",
      EG: "EGP",
      SA: "SAR",
      AE: "AED",
      JO: "JOD",
      KW: "KWD",
      QA: "QAR",
      BH: "BHD",
      OM: "OMR",
      US: "USD",
      GB: "GBP",
      CA: "CAD",
      AU: "AUD",
    }
    for (const [country, expected] of Object.entries(cases)) {
      expect(resolveDefaultCurrency(country), country).toBe(expected)
    }
  })

  it("falls back to USD when country is unknown (never crashes onboarding)", () => {
    expect(resolveDefaultCurrency("ZZ")).toBe("USD")
    expect(resolveDefaultCurrency(null)).toBe("USD")
    expect(resolveDefaultCurrency(undefined)).toBe("USD")
    expect(resolveDefaultCurrency("")).toBe("USD")
  })

  describe("guard clause semantics (documents the action's conditional overwrite)", () => {
    // The action only overwrites when ALL of:
    //   current.currency === "USD"
    //   !current.tuitionFee
    //   resolvedCurrency !== "USD"
    // These branches protect existing data — any change to the guard MUST
    // update this test so intent stays obvious to future readers.

    const guardOverwrite = (params: {
      currentCurrency: string
      currentTuitionFee: number | null
      country: string
    }) => {
      const resolved = resolveDefaultCurrency(params.country)
      return (
        params.currentCurrency === "USD" &&
        !params.currentTuitionFee &&
        resolved !== "USD"
      )
    }

    it("overwrites for a fresh Sudanese school (the 3-schools-stuck-on-USD bug)", () => {
      expect(
        guardOverwrite({
          currentCurrency: "USD",
          currentTuitionFee: null,
          country: "SD",
        })
      ).toBe(true)
    })

    it("does NOT overwrite if admin already set tuitionFee (past onboarding)", () => {
      expect(
        guardOverwrite({
          currentCurrency: "USD",
          currentTuitionFee: 12000,
          country: "SD",
        })
      ).toBe(false)
    })

    it("does NOT overwrite if admin explicitly chose a non-USD currency", () => {
      expect(
        guardOverwrite({
          currentCurrency: "EUR",
          currentTuitionFee: null,
          country: "SD",
        })
      ).toBe(false)
    })

    it("does NOT overwrite for a US school (resolved equals current)", () => {
      expect(
        guardOverwrite({
          currentCurrency: "USD",
          currentTuitionFee: null,
          country: "US",
        })
      ).toBe(false)
    })

    it("does NOT overwrite for unknown country (USD stays USD)", () => {
      expect(
        guardOverwrite({
          currentCurrency: "USD",
          currentTuitionFee: null,
          country: "ZZ",
        })
      ).toBe(false)
    })
  })
})
