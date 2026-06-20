// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import {
  calculateProgressiveTax,
  TAX_BRACKETS,
} from "@/components/school-dashboard/finance/payroll/config"

describe("payroll/config — calculateProgressiveTax (marginal, whole units)", () => {
  it("is zero at and below the tax-free threshold", () => {
    expect(calculateProgressiveTax(0)).toBe(0)
    expect(calculateProgressiveTax(20000)).toBe(0)
  })

  it("taxes only the portion inside each bracket (marginal, not flat)", () => {
    // 20,000–50,000 @10% → 30,000 * 0.10 = 3,000
    expect(calculateProgressiveTax(50000)).toBe(3000)
    // + 50,000–100,000 @15% on a 120k gross:
    // 30,000*0.10 + 50,000*0.15 + 20,000*0.20 = 3,000 + 7,500 + 4,000 = 14,500
    expect(calculateProgressiveTax(120000)).toBe(14500)
    // top bracket: 3,000 + 7,500 + 100,000*0.20 + 50,000*0.25 = 43,000
    expect(calculateProgressiveTax(250000)).toBe(43000)
  })

  it("is progressive — effective rate rises with income, never exceeds top rate", () => {
    const lowRate = calculateProgressiveTax(120000) / 120000
    const highRate = calculateProgressiveTax(250000) / 250000
    expect(highRate).toBeGreaterThan(lowRate)
    const topRate = TAX_BRACKETS[TAX_BRACKETS.length - 1].rate / 100
    expect(highRate).toBeLessThan(topRate)
  })
})
