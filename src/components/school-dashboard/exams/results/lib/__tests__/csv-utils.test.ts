// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import { escapeCsv } from "../csv-utils"

describe("escapeCsv — CSV/formula injection defense", () => {
  it("wraps plain values in double quotes", () => {
    expect(escapeCsv("Ali Hassan")).toBe('"Ali Hassan"')
  })

  it("doubles internal double quotes", () => {
    expect(escapeCsv('She said "hi"')).toBe('"She said ""hi"""')
  })

  it("renders null/undefined as an empty quoted cell", () => {
    expect(escapeCsv(null)).toBe('""')
    expect(escapeCsv(undefined)).toBe('""')
  })

  it("stringifies numbers", () => {
    expect(escapeCsv(42)).toBe('"42"')
  })

  it.each(["=1+1", "+1", "-1", "@SUM(A1)", "\tcmd", "\rcmd"])(
    "neutralizes a leading formula trigger in %j",
    (payload) => {
      const out = escapeCsv(payload)
      // a single quote is inserted right after the opening double-quote
      expect(out.startsWith("\"'")).toBe(true)
    }
  )

  it("neutralizes the classic =cmd|' /C calc'!A0 payload", () => {
    const payload = `=cmd|' /C calc'!A0`
    const out = escapeCsv(payload)
    expect(out).toBe(`"'=cmd|' /C calc'!A0"`)
  })

  it("does not prefix a value with a non-leading special char", () => {
    // a minus in the middle is harmless
    expect(escapeCsv("Grade A-")).toBe('"Grade A-"')
  })

  it("does not prefix a normal negative-looking score string mid-cell", () => {
    expect(escapeCsv("up to 10")).toBe('"up to 10"')
  })
})
