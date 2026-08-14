// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import { formatCompactMoney } from "@/components/school-dashboard/finance/lib/format-money"

/**
 * `Intl` separates the currency code from the digits with a NON-BREAKING space
 * (U+00A0), not a plain one. Asserting with a normal space fails with two
 * strings that look byte-identical in the diff, so spell it out.
 */
const NB = "\u00a0"

describe("formatCompactMoney", () => {
  it("abbreviates large figures in English", () => {
    expect(formatCompactMoney(10_593_000, "SDG", "en")).toBe(`SDG${NB}10.6m`)
    expect(formatCompactMoney(164_452, "SDG", "en")).toBe(`SDG${NB}164.5k`)
    expect(formatCompactMoney(1_500_000_000, "SDG", "en")).toBe(`SDG${NB}1.5b`)
  })

  it("abbreviates with the Arabic WORD, never a Latin letter", () => {
    // The bug this guards: gluing "m" onto Arabic digits gave "١٠٫٦m ج.س."
    const millions = formatCompactMoney(10_593_000, "SDG", "ar")
    expect(millions).toContain("مليون")
    expect(millions).not.toMatch(/[A-Za-z]/)

    const thousands = formatCompactMoney(164_452, "SDG", "ar")
    expect(thousands).toContain("ألف")
    expect(thousands).not.toMatch(/[A-Za-z]/)
  })

  it("keeps the currency code's capitals while lowercasing the unit", () => {
    expect(formatCompactMoney(10_593_000, "SDG", "en")).toContain("SDG")
  })

  it("leaves small figures exact in both languages", () => {
    expect(formatCompactMoney(4_820, "SDG", "en")).toBe(`SDG${NB}4,820`)
    expect(formatCompactMoney(0, "SDG", "en")).toBe(`SDG${NB}0`)
    expect(formatCompactMoney(4_820, "SDG", "ar")).not.toContain("ألف")
  })

  it("handles negatives", () => {
    expect(formatCompactMoney(-10_593_000, "SDG", "en")).toBe(`-SDG${NB}10.6m`)
  })
})
