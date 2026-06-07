// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import {
  formatCurrency,
  fromCents,
  toCents,
  validateDoubleEntry,
} from "@/components/school-dashboard/finance/lib/accounting/utils"

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("accounting/utils — validateDoubleEntry", () => {
  it("returns true when total debits equal total credits", () => {
    const lines = [
      { accountId: "a", debit: 100, credit: 0, description: "" },
      { accountId: "b", debit: 0, credit: 100, description: "" },
    ]
    expect(validateDoubleEntry(lines)).toBe(true)
  })

  it("returns true when 3+ lines balance to zero", () => {
    const lines = [
      { accountId: "a", debit: 100, credit: 0, description: "" },
      { accountId: "b", debit: 0, credit: 60, description: "" },
      { accountId: "c", debit: 0, credit: 40, description: "" },
    ]
    expect(validateDoubleEntry(lines)).toBe(true)
  })

  it("returns false when debits != credits", () => {
    const lines = [
      { accountId: "a", debit: 100, credit: 0, description: "" },
      { accountId: "b", debit: 0, credit: 50, description: "" },
    ]
    expect(validateDoubleEntry(lines)).toBe(false)
  })

  it("tolerates sub-cent rounding (under 1 cent)", () => {
    // Two lines that differ by 0.001 due to floating-point arithmetic
    const lines = [
      { accountId: "a", debit: 333.333, credit: 0, description: "" },
      { accountId: "b", debit: 0, credit: 333.334, description: "" },
    ]
    expect(validateDoubleEntry(lines)).toBe(true)
  })
})

describe("accounting/utils — currency conversion", () => {
  it("toCents multiplies by 100 with rounding", () => {
    expect(toCents(1.99)).toBe(199)
    expect(toCents(1)).toBe(100)
    expect(toCents(0)).toBe(0)
    expect(toCents(0.005)).toBe(1) // rounds half-up
  })

  it("fromCents divides by 100", () => {
    expect(fromCents(100)).toBe(1)
    expect(fromCents(199)).toBe(1.99)
    expect(fromCents(0)).toBe(0)
  })

  it("toCents and fromCents round-trip for typical amounts", () => {
    for (const amount of [0, 1, 1.5, 99.99, 1234.56]) {
      expect(fromCents(toCents(amount))).toBe(amount)
    }
  })
})

describe("accounting/utils — formatCurrency", () => {
  it("returns a non-empty formatted string for USD", () => {
    const out = formatCurrency(1234.5, "USD")
    expect(out.length).toBeGreaterThan(0)
    expect(typeof out).toBe("string")
  })

  it("returns a non-empty formatted string for SAR", () => {
    const out = formatCurrency(99, "SAR")
    expect(out.length).toBeGreaterThan(0)
  })

  it("handles zero amount", () => {
    const out = formatCurrency(0, "USD")
    expect(out.length).toBeGreaterThan(0)
  })
})
