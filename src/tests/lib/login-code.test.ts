// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * School members sign in with a 6-digit code (YY + one per-school serial
 * shared by every role) and an easy 4-digit PIN.
 */

import { describe, expect, it } from "vitest"

import { generateEasyPin } from "@/lib/credentials"
import { isLoginCode, LOGIN_CODE_RE, nextSerials } from "@/lib/login-code"

describe("nextSerials", () => {
  it("starts at 0001 for a fresh year", () => {
    expect(nextSerials("26", [], 1)).toEqual(["260001"])
  })

  it("continues after the highest code of the same year", () => {
    expect(nextSerials("26", ["260041", "260007", null], 3)).toEqual([
      "260042",
      "260043",
      "260044",
    ])
  })

  it("ignores other years and non-codes", () => {
    expect(
      nextSerials("27", ["269999", "26010001", "ali.hassan"], 1)
    ).toEqual(["270001"])
  })

  it("refuses to pass 9999", () => {
    expect(() => nextSerials("26", ["269998"], 2)).toThrow(
      /LOGIN_CODES_EXHAUSTED/
    )
    expect(nextSerials("26", ["269998"], 1)).toEqual(["269999"])
  })

  it("codes are 6 digits and login-valid", () => {
    for (const code of nextSerials("26", [], 20)) {
      expect(code).toMatch(LOGIN_CODE_RE)
      expect(code).toMatch(/^[A-Za-z0-9._-]{3,64}$/)
    }
  })
})

describe("isLoginCode", () => {
  it("recognises new and student codes, not names", () => {
    expect(isLoginCode("260001")).toBe(true)
    expect(isLoginCode("26010001")).toBe(true)
    expect(isLoginCode("26G010001")).toBe(true)
    expect(isLoginCode("محمد أحمد")).toBe(false)
    expect(isLoginCode("ali.hassan")).toBe(false)
    expect(isLoginCode(null)).toBe(false)
  })
})

describe("generateEasyPin", () => {
  const pins = Array.from({ length: 500 }, () => generateEasyPin())

  it("is always 4 digits", () => {
    for (const pin of pins) expect(pin).toMatch(/^\d{4}$/)
  })

  it("never hands out the weakest PINs", () => {
    for (const pin of pins) {
      expect(pin).not.toMatch(/^(\d)\1{3}$/)
      expect(["1234", "4321", "0123"]).not.toContain(pin)
      expect(pin).not.toMatch(/^(19|20)\d\d$/)
    }
  })

  it("is varied, not one PIN for everyone", () => {
    expect(new Set(pins).size).toBeGreaterThan(100)
  })

  it("keeps a batch distinct while the pattern space lasts", () => {
    const taken = new Set<string>()
    const batch = Array.from({ length: 100 }, () => generateEasyPin(taken))
    expect(new Set(batch).size).toBe(100)
  })
})
