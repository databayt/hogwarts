import { describe, expect, it } from "vitest"

import {
  annualPriceSAR,
  billableStudents,
  formatAmount,
  formatMoney,
  FREE_STUDENTS,
  quote,
  RATE_TIERS,
  TRIAL_MONTHS,
  type Rates,
} from "@/components/saas-marketing/pricing/rates"

const rates: Rates = { SAR: 1, USD: 0.266667, SDG: 136, EGP: 14 }

describe("graduated per-student pricing", () => {
  it("has the 24 / 16 / 14 SAR tiers and no free allowance", () => {
    expect(RATE_TIERS.map((t) => t.sarPerStudent)).toEqual([24, 16, 14, 14])
    expect(FREE_STUDENTS).toBe(0)
    expect(annualPriceSAR(0)).toBe(0)
    expect(billableStudents(50)).toBe(50)
  })

  it("hits the agreed anchors and the tier edges", () => {
    expect(annualPriceSAR(1)).toBe(24)
    expect(annualPriceSAR(48)).toBe(1152)
    expect(annualPriceSAR(250)).toBe(6000)
    expect(annualPriceSAR(251)).toBe(6016)
    expect(annualPriceSAR(300)).toBe(6800)
    expect(annualPriceSAR(500)).toBe(10000)
    expect(annualPriceSAR(501)).toBe(10014)
    expect(annualPriceSAR(1000)).toBe(17000)
    expect(annualPriceSAR(1200)).toBe(19800)
  })

  it("is continuous: each student adds exactly its tier's rate", () => {
    for (const n of [0, 1, 48, 249, 250, 251, 499, 500, 501, 999, 1000, 4321]) {
      const step = annualPriceSAR(n + 1) - annualPriceSAR(n)
      expect([24, 16, 14]).toContain(step)
      expect(step).toBe(n < 250 ? 24 : n < 500 ? 16 : 14)
    }
  })

  it("gives every new school one free month", () => {
    expect(TRIAL_MONTHS).toBe(1)
  })

  it("quotes Al-Ibda (48 students) at $307.20 a year, $153.60 first", () => {
    const q = quote(48, "USD", rates)
    expect(q.annual).toBeCloseTo(307.2, 1)
    expect(q.atSigning).toBeCloseTo(153.6, 1)
    expect(q.instalment).toBeCloseTo(38.4, 1)
  })

  it("splits 50% and 4 × 12.5% (6,000 → 3,000 + 4 × 750)", () => {
    const q = quote(250, "SAR", rates)
    expect(q.annual).toBe(6000)
    expect(q.atSigning).toBe(3000)
    expect(q.instalment).toBe(750)
    expect(q.atSigning + 4 * q.instalment).toBe(q.annual)
    expect(q.monthly).toBe(500)
  })

  it("derives the per-student average from the total", () => {
    expect(quote(250, "SAR", rates).perStudentYear).toBe(24)
    expect(quote(500, "SAR", rates).perStudentYear).toBe(20)
    expect(quote(1000, "SAR", rates).perStudentYear).toBe(17)
  })

  it("converts every amount at the given rate", () => {
    const q = quote(250, "USD", rates)
    expect(q.annual).toBeCloseTo(1600, 1)
    expect(q.ratePerStudentYear).toBeCloseTo(6.4, 2)
    expect(quote(300, "SDG", rates).annual).toBe(6800 * 136)
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
    expect(formatMoney(6000, "SAR", "en")).toBe("6,000 SAR")
    expect(formatMoney(24, "SAR", "ar")).toBe("24 ر.س")
    expect(formatMoney(3264, "SDG", "ar")).toBe("3,264 ج.س")
  })
})
