// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import {
  compareTranslationFiles,
  diffKeys,
  flattenKeys,
} from "../key-diff"

// ---------------------------------------------------------------------------
// flattenKeys
// ---------------------------------------------------------------------------

describe("flattenKeys", () => {
  it("returns [] for an empty object", () => {
    expect(flattenKeys({})).toEqual([])
  })

  it("walks one level", () => {
    expect(flattenKeys({ a: "x", b: "y" }).sort()).toEqual(["a", "b"])
  })

  it("walks nested namespaces and dot-joins them", () => {
    const out = flattenKeys({
      finance: { fees: { title: "Fees", overview: "View" } },
      admin: { dashboard: "Home" },
    })
    expect(out.sort()).toEqual([
      "admin.dashboard",
      "finance.fees.overview",
      "finance.fees.title",
    ])
  })

  it("treats arrays as leaves (don't recurse into them — they're translation lists, not nested namespaces)", () => {
    const out = flattenKeys({ tags: ["a", "b", "c"], single: "x" })
    expect(out.sort()).toEqual(["single", "tags"])
  })

  it("treats null as a leaf", () => {
    expect(flattenKeys({ a: null, b: "x" }).sort()).toEqual(["a", "b"])
  })

  it("treats numbers and booleans as leaves", () => {
    expect(flattenKeys({ count: 5, enabled: true }).sort()).toEqual([
      "count",
      "enabled",
    ])
  })

  it("preserves namespace prefix across the recursion", () => {
    const out = flattenKeys({ a: { b: { c: { d: "deep" } } } })
    expect(out).toEqual(["a.b.c.d"])
  })
})

// ---------------------------------------------------------------------------
// diffKeys
// ---------------------------------------------------------------------------

describe("diffKeys", () => {
  it("returns empty diffs when both arrays are identical", () => {
    const d = diffKeys(["a", "b", "c"], ["a", "b", "c"])
    expect(d).toEqual({ missingFromA: [], missingFromB: [] })
  })

  it("captures keys in B that are missing from A", () => {
    const d = diffKeys(["a"], ["a", "b", "c"])
    expect(d.missingFromA).toEqual(["b", "c"])
    expect(d.missingFromB).toEqual([])
  })

  it("captures keys in A that are missing from B", () => {
    const d = diffKeys(["a", "b", "c"], ["a"])
    expect(d.missingFromA).toEqual([])
    expect(d.missingFromB).toEqual(["b", "c"])
  })

  it("handles both-directions drift", () => {
    const d = diffKeys(["a", "b"], ["b", "c"])
    expect(d.missingFromA).toEqual(["c"])
    expect(d.missingFromB).toEqual(["a"])
  })

  it("returns results sorted alphabetically (stable for CI logs)", () => {
    const d = diffKeys([], ["zebra", "apple", "mango"])
    expect(d.missingFromA).toEqual(["apple", "mango", "zebra"])
  })

  it("handles empty inputs", () => {
    expect(diffKeys([], [])).toEqual({ missingFromA: [], missingFromB: [] })
  })
})

// ---------------------------------------------------------------------------
// compareTranslationFiles
// ---------------------------------------------------------------------------

describe("compareTranslationFiles", () => {
  it("reports isSynced=true when both dictionaries have the same leaf paths", () => {
    const ar = { greeting: "مرحبا", actions: { save: "حفظ" } }
    const en = { greeting: "Hello", actions: { save: "Save" } }
    const diff = compareTranslationFiles(ar, en)
    expect(diff.isSynced).toBe(true)
    expect(diff.missingInAr).toEqual([])
    expect(diff.missingInEn).toEqual([])
  })

  it("detects keys missing from the AR side (typical: EN added without translating)", () => {
    const ar = { greeting: "مرحبا" }
    const en = { greeting: "Hello", goodbye: "Bye" }
    const diff = compareTranslationFiles(ar, en)
    expect(diff.isSynced).toBe(false)
    expect(diff.missingInAr).toEqual(["goodbye"])
    expect(diff.missingInEn).toEqual([])
  })

  it("detects keys missing from the EN side (rarer: AR translated first)", () => {
    const ar = { greeting: "مرحبا", goodbye: "وداعا" }
    const en = { greeting: "Hello" }
    const diff = compareTranslationFiles(ar, en)
    expect(diff.isSynced).toBe(false)
    expect(diff.missingInAr).toEqual([])
    expect(diff.missingInEn).toEqual(["goodbye"])
  })

  it("detects drift on nested namespace paths (the common case for feature dictionaries)", () => {
    const ar = { finance: { fees: { title: "الرسوم" } } }
    const en = {
      finance: { fees: { title: "Fees", overview: "Overview" } },
    }
    const diff = compareTranslationFiles(ar, en)
    expect(diff.isSynced).toBe(false)
    expect(diff.missingInAr).toEqual(["finance.fees.overview"])
    expect(diff.missingInEn).toEqual([])
  })

  it("treats two empty dictionaries as synced", () => {
    const diff = compareTranslationFiles({}, {})
    expect(diff.isSynced).toBe(true)
    expect(diff.missingInAr).toEqual([])
    expect(diff.missingInEn).toEqual([])
  })

  it("does NOT treat structural differences as drift if the leaf paths still match", () => {
    // Both end at the same leaf paths even though one nests via a different
    // intermediate. Edge case worth documenting: the comparator is path-only.
    const a = { user: { name: "X" } }
    const b = { user: { name: "Y" } } // same path "user.name", different value
    const diff = compareTranslationFiles(a, b)
    expect(diff.isSynced).toBe(true)
  })
})
