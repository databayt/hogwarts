import { describe, expect, it } from "vitest"

import {
  annualPriceSAR,
  billableStudents,
  formatAmount,
  formatMoney,
  quote,
  type Rates,
} from "@/components/saas-marketing/pricing/rates"

const rates: Rates = { SAR: 1, USD: 0.266667, SDG: 136, EGP: 14 }

describe("per-student pricing", () => {
  it("is 24 SAR per student beyond the free 100", () => {
    expect(annualPriceSAR(0)).toBe(0)
    expect(annualPriceSAR(100)).toBe(0)
    expect(annualPriceSAR(101)).toBe(24)
    expect(annualPriceSAR(250)).toBe(3600)
    expect(annualPriceSAR(300)).toBe(4800)
    expect(annualPriceSAR(1000)).toBe(21600)
    expect(billableStudents(50)).toBe(0)
  })

  it("moves by exactly one rate per student — no bands", () => {
    for (const n of [101, 250, 499, 500, 999, 1000, 4321]) {
      expect(annualPriceSAR(n + 1) - annualPriceSAR(n)).toBe(24)
    }
  })

  it("splits 50% at signing and 4 × 12.5%", () => {
    const q = quote(300, "SAR", rates)
    expect(q.atSigning).toBe(2400)
    expect(q.instalment).toBe(600)
    expect(q.atSigning + 4 * q.instalment).toBe(q.annual)
    expect(q.monthly).toBe(400)
    expect(q.perStudentYear).toBe(16)
  })

  it("converts every amount at the given rate", () => {
    const q = quote(300, "USD", rates)
    expect(q.annual).toBeCloseTo(1280, 1)
    expect(q.ratePerStudentYear).toBeCloseTo(6.4, 2)
    expect(quote(300, "SDG", rates).annual).toBe(4800 * 136)
  })
})

describe("formatting", () => {
  it("keeps two decimals below 100 and whole units above", () => {
    expect(formatAmount(6.4)).toBe("6.40")
    expect(formatAmount(24)).toBe("24")
    expect(formatAmount(652800)).toBe("652,800")
    expect(formatAmount(1280.0004)).toBe("1,280")
  })

  it("labels currency per locale", () => {
    expect(formatMoney(24, "SAR", "en")).toBe("24 SAR")
    expect(formatMoney(24, "SAR", "ar")).toBe("24 ر.س")
    expect(formatMoney(3264, "SDG", "ar")).toBe("3,264 ج.س")
  })
})
