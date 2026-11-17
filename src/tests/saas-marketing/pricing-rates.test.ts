import { describe, expect, it } from "vitest"

import {
  annualPriceSAR,
  billableStudents,
  formatAmount,
  formatMoney,
  FREE_STUDENTS,
  quote,
  TRIAL_MONTHS,
  type Rates,
} from "@/components/saas-marketing/pricing/rates"

const rates: Rates = { SAR: 1, USD: 0.266667, SDG: 136, EGP: 14 }

describe("per-student pricing", () => {
  it("is 24 SAR per student from the first — no free allowance", () => {
    expect(FREE_STUDENTS).toBe(0)
    expect(annualPriceSAR(0)).toBe(0)
    expect(annualPriceSAR(1)).toBe(24)
    expect(annualPriceSAR(100)).toBe(2400)
    expect(annualPriceSAR(250)).toBe(6000) // the 2026-10-09 anchor
    expect(annualPriceSAR(300)).toBe(7200)
    expect(annualPriceSAR(1000)).toBe(24000)
    expect(billableStudents(50)).toBe(50)
  })

  it("gives every new school one free month", () => {
    expect(TRIAL_MONTHS).toBe(1)
  })

  it("quotes Al-Ibda (48 students) at $307.20 a year, $153.60 first", () => {
    const q = quote(48, "USD", rates)
    expect(annualPriceSAR(48)).toBe(1152)
    expect(q.annual).toBeCloseTo(307.2, 1)
    expect(q.atSigning).toBeCloseTo(153.6, 1)
    expect(q.instalment).toBeCloseTo(38.4, 1)
  })

  it("moves by exactly one rate per student — no bands", () => {
    for (const n of [1, 48, 100, 250, 499, 500, 999, 1000, 4321]) {
      expect(annualPriceSAR(n + 1) - annualPriceSAR(n)).toBe(24)
    }
  })

  it("splits 50% at signing and 4 × 12.5%", () => {
    const q = quote(300, "SAR", rates)
    expect(q.atSigning).toBe(3600)
    expect(q.instalment).toBe(900)
    expect(q.atSigning + 4 * q.instalment).toBe(q.annual)
    expect(q.monthly).toBe(600)
    expect(q.perStudentYear).toBe(24)
  })

  it("converts every amount at the given rate", () => {
    const q = quote(300, "USD", rates)
    expect(q.annual).toBeCloseTo(1920, 1)
    expect(q.ratePerStudentYear).toBeCloseTo(6.4, 2)
    expect(quote(300, "SDG", rates).annual).toBe(7200 * 136)
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
