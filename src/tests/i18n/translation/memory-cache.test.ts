// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it } from "vitest"

import {
  isHotTerm,
  memoClear,
  memoGet,
  memoSet,
  memoSize,
} from "@/components/translation/memory-cache"

// The LRU is process-global — every suite that touches it must reset.
beforeEach(() => memoClear())

describe("memory-cache (process LRU glossary)", () => {
  it("round-trips a hot term", () => {
    memoSet("s1", "ar", "en", "مرحبا", "Hello")
    expect(memoGet("s1", "ar", "en", "مرحبا")).toBe("Hello")
    expect(memoSize()).toBe(1)
  })

  it("keys by school AND direction — no cross-tenant or cross-direction bleed", () => {
    memoSet("s1", "ar", "en", "مرحبا", "Hello")
    expect(memoGet("s2", "ar", "en", "مرحبا")).toBeUndefined()
    expect(memoGet("s1", "en", "ar", "مرحبا")).toBeUndefined()
  })

  it("skips strings longer than 120 chars (hot TERMS only — bodies go to the DB tier)", () => {
    const long = "x".repeat(121)
    memoSet("s1", "ar", "en", long, "translated")
    expect(memoGet("s1", "ar", "en", long)).toBeUndefined()
    expect(memoSize()).toBe(0)
    expect(isHotTerm(long)).toBe(false)
    expect(isHotTerm("x".repeat(120))).toBe(true)
  })

  it("evicts the OLDEST entry once past capacity (5000)", () => {
    for (let i = 0; i < 5001; i++) {
      memoSet("s1", "ar", "en", `term-${i}`, `t-${i}`)
    }
    expect(memoSize()).toBe(5000)
    expect(memoGet("s1", "ar", "en", "term-0")).toBeUndefined() // evicted
    expect(memoGet("s1", "ar", "en", "term-5000")).toBe("t-5000")
  })

  it("touch-on-get protects a hot entry from eviction (true LRU, not FIFO)", () => {
    for (let i = 0; i < 5000; i++) {
      memoSet("s1", "ar", "en", `term-${i}`, `t-${i}`)
    }
    // term-0 is the oldest — touching it moves it to the MRU end…
    expect(memoGet("s1", "ar", "en", "term-0")).toBe("t-0")
    // …so the next insert evicts term-1 instead.
    memoSet("s1", "ar", "en", "newcomer", "n")
    expect(memoGet("s1", "ar", "en", "term-0")).toBe("t-0")
    expect(memoGet("s1", "ar", "en", "term-1")).toBeUndefined()
  })

  it("memoClear resets the store (test isolation primitive)", () => {
    memoSet("s1", "ar", "en", "مرحبا", "Hello")
    memoClear()
    expect(memoSize()).toBe(0)
    expect(memoGet("s1", "ar", "en", "مرحبا")).toBeUndefined()
  })
})
