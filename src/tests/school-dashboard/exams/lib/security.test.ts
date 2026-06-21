// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  checkAIGenerationRateLimit,
  checkAIGradingRateLimit,
} from "@/components/school-dashboard/exams/lib/security"

// The rate-limit store is an in-memory module-level Map keyed by schoolId, so
// every test uses a UNIQUE schoolId to avoid cross-test leakage. Time is faked
// so window resets are deterministic.

describe("exams/security — checkAIGenerationRateLimit (cost cap)", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-06-21T00:00:00Z"))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("allows a burst up to the per-minute limit then blocks with scope=minute", () => {
    const schoolId = "s-burst"
    // 20 requests / minute is the documented burst guard
    for (let i = 0; i < 20; i++) {
      const r = checkAIGenerationRateLimit(schoolId)
      expect(r.allowed, `request ${i + 1} should be allowed`).toBe(true)
    }
    const blocked = checkAIGenerationRateLimit(schoolId)
    expect(blocked.allowed).toBe(false)
    expect(blocked.scope).toBe("minute")
    expect(blocked.remaining).toBe(0)
    expect(blocked.resetIn).toBeGreaterThan(0)
    expect(blocked.resetIn).toBeLessThanOrEqual(60_000)
  })

  it("permits requests again after the minute window resets", () => {
    const schoolId = "s-reset"
    for (let i = 0; i < 20; i++) checkAIGenerationRateLimit(schoolId)
    expect(checkAIGenerationRateLimit(schoolId).allowed).toBe(false)

    // Advance past the 1-minute window
    vi.advanceTimersByTime(61_000)
    const afterReset = checkAIGenerationRateLimit(schoolId)
    expect(afterReset.allowed).toBe(true)
    expect(afterReset.scope).toBe("minute")
  })

  it("enforces a daily ceiling independent of the per-minute reset", () => {
    const schoolId = "s-day"
    let dayBlocked = false
    // Spread calls across minute windows so the burst guard never trips; the
    // daily counter (300) should eventually block with scope=day.
    for (let burst = 0; burst < 20 && !dayBlocked; burst++) {
      for (let i = 0; i < 20; i++) {
        const r = checkAIGenerationRateLimit(schoolId)
        if (!r.allowed) {
          expect(r.scope).toBe("day")
          dayBlocked = true
          break
        }
      }
      vi.advanceTimersByTime(61_000) // new minute window, same day
    }
    expect(dayBlocked).toBe(true)
  })
})

describe("exams/security — checkAIGradingRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-06-21T00:00:00Z"))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("allows up to 100 grading requests / minute / school then blocks", () => {
    const schoolId = "s-grade"
    for (let i = 0; i < 100; i++) {
      expect(checkAIGradingRateLimit(schoolId).allowed).toBe(true)
    }
    expect(checkAIGradingRateLimit(schoolId).allowed).toBe(false)
  })

  it("scopes the limit per school", () => {
    for (let i = 0; i < 100; i++) checkAIGradingRateLimit("s-grade-a")
    // A different school is unaffected
    expect(checkAIGradingRateLimit("s-grade-b").allowed).toBe(true)
  })
})
