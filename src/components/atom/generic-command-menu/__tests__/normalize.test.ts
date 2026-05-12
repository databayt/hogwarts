// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import { normalizeForMatch } from "../normalize"

describe("normalizeForMatch", () => {
  it("returns empty string for falsy input", () => {
    expect(normalizeForMatch("")).toBe("")
    // @ts-expect-error — exercising defensive guard
    expect(normalizeForMatch(undefined)).toBe("")
    // @ts-expect-error
    expect(normalizeForMatch(null)).toBe("")
  })

  it("strips Latin diacritics (NFD)", () => {
    expect(normalizeForMatch("Café")).toBe("cafe")
    expect(normalizeForMatch("Müller")).toBe("muller")
    expect(normalizeForMatch("naïve")).toBe("naive")
    expect(normalizeForMatch("Ñoño")).toBe("nono")
  })

  it("collapses Arabic alef variants", () => {
    expect(normalizeForMatch("أحمد")).toBe(normalizeForMatch("احمد"))
    expect(normalizeForMatch("إبراهيم")).toBe(normalizeForMatch("ابراهيم"))
    expect(normalizeForMatch("آدم")).toBe(normalizeForMatch("ادم"))
  })

  it("collapses ya variants", () => {
    expect(normalizeForMatch("علي")).toBe(normalizeForMatch("على"))
  })

  it("collapses ta-marbuta to ha", () => {
    expect(normalizeForMatch("فاطمة")).toBe(normalizeForMatch("فاطمه"))
  })

  it("strips tatweel", () => {
    expect(normalizeForMatch("محـــمد")).toBe(normalizeForMatch("محمد"))
  })

  it("strips Arabic harakat (tashkeel)", () => {
    expect(normalizeForMatch("مُحَمَّد")).toBe(normalizeForMatch("محمد"))
    expect(normalizeForMatch("اَلسَّلَامُ")).toBe(normalizeForMatch("السلام"))
  })

  it("is case-insensitive", () => {
    expect(normalizeForMatch("AHMED")).toBe(normalizeForMatch("ahmed"))
    expect(normalizeForMatch("Ahmed")).toBe(normalizeForMatch("ahmed"))
  })

  it("collapses whitespace and trims", () => {
    expect(normalizeForMatch("  ahmed  hassan  ")).toBe("ahmed hassan")
    expect(normalizeForMatch("ahmed\thassan")).toBe("ahmed hassan")
    expect(normalizeForMatch("ahmed\nhassan")).toBe("ahmed hassan")
  })

  it("handles mixed Latin + Arabic input", () => {
    // STUDENT-2024-أحمد should match a stored "STUDENT-2024-احمد" key
    expect(normalizeForMatch("STUDENT-2024-أحمد")).toBe(
      normalizeForMatch("student-2024-احمد")
    )
  })

  it("is idempotent", () => {
    const input = "أحمد علي"
    const once = normalizeForMatch(input)
    const twice = normalizeForMatch(once)
    expect(once).toBe(twice)
  })
})
