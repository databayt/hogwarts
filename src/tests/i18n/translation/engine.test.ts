// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Provider-chain engine tests: Google first, Groq fallback, circuit breakers
 * skipping a dead provider, and error preference (root cause surfaces).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  getTranslationEngineState,
  resetTranslationEngine,
  translateBatch,
  translateRaw,
} from "@/components/translation/engine"

const { googleBatch, googleRaw, groqBatch, groqRaw } = vi.hoisted(() => ({
  googleBatch: vi.fn(),
  googleRaw: vi.fn(),
  groqBatch: vi.fn(),
  groqRaw: vi.fn(),
}))
vi.mock("@/components/translation/google", () => ({
  translateBatch: googleBatch,
  translateRaw: googleRaw,
}))
vi.mock("@/components/translation/groq", () => ({
  groqTranslateBatch: groqBatch,
  groqTranslateRaw: groqRaw,
}))

beforeEach(() => {
  vi.clearAllMocks()
  resetTranslationEngine() // breakers are module-level — never bleed across tests
})

afterEach(() => {
  vi.useRealTimers()
})

describe("translateBatch chain", () => {
  it("returns Google's result without touching Groq when Google succeeds", async () => {
    googleBatch.mockResolvedValueOnce(["مرحبا"])

    const result = await translateBatch(["hello"], "en", "ar")

    expect(result).toEqual(["مرحبا"])
    expect(groqBatch).not.toHaveBeenCalled()
  })

  it("falls back to Groq when Google fails", async () => {
    googleBatch.mockRejectedValueOnce(
      new Error("Google Translate API error: 403")
    )
    groqBatch.mockResolvedValueOnce(["مرحبا"])

    const result = await translateBatch(["hello"], "en", "ar")

    expect(result).toEqual(["مرحبا"])
    expect(googleBatch).toHaveBeenCalledTimes(1)
    expect(groqBatch).toHaveBeenCalledTimes(1)
  })

  it("throws the ORIGINAL Google error when both providers fail", async () => {
    googleBatch.mockRejectedValueOnce(
      new Error("Google Translate API error: 403 - quota")
    )
    groqBatch.mockRejectedValueOnce(new Error("GROQ_API_KEY not configured"))

    await expect(translateBatch(["hello"], "en", "ar")).rejects.toThrow(
      "Google Translate API error: 403 - quota"
    )
  })

  it("skips empty input without calling any provider", async () => {
    const result = await translateBatch(["", "   "], "en", "ar")

    expect(result).toEqual(["", ""])
    expect(googleBatch).not.toHaveBeenCalled()
    expect(groqBatch).not.toHaveBeenCalled()
  })

  it("opens the Google breaker after 3 consecutive failures and goes straight to Groq", async () => {
    googleBatch.mockRejectedValue(new Error("Google Translate API error: 403"))
    groqBatch.mockResolvedValue(["مرحبا"])

    await translateBatch(["a"], "en", "ar")
    await translateBatch(["b"], "en", "ar")
    await translateBatch(["c"], "en", "ar")
    expect(googleBatch).toHaveBeenCalledTimes(3)
    expect(getTranslationEngineState().google.state).toBe("open")

    // Breaker open — 4th call must NOT hit Google at all.
    const result = await translateBatch(["d"], "en", "ar")
    expect(result).toEqual(["مرحبا"])
    expect(googleBatch).toHaveBeenCalledTimes(3)
    expect(groqBatch).toHaveBeenCalledTimes(4)
  })

  it("surfaces the GROQ error (not breaker noise) when the Google breaker is open", async () => {
    googleBatch.mockRejectedValue(new Error("Google dead"))
    groqBatch.mockResolvedValue(["ok"])
    for (let i = 0; i < 3; i++) await translateBatch(["x"], "en", "ar")

    groqBatch.mockRejectedValueOnce(
      new Error("Groq API error: 429 - rate limit")
    )

    await expect(translateBatch(["y"], "en", "ar")).rejects.toThrow(
      "Groq API error: 429 - rate limit"
    )
  })

  it("probes Google again after the cooldown (half-open) and closes on success", async () => {
    vi.useFakeTimers()
    googleBatch.mockRejectedValue(new Error("Google dead"))
    groqBatch.mockResolvedValue(["من Groq"])
    for (let i = 0; i < 3; i++) await translateBatch(["x"], "en", "ar")
    expect(getTranslationEngineState().google.state).toBe("open")

    // After the 5-minute cooldown Google recovers.
    vi.advanceTimersByTime(5 * 60_000 + 1)
    googleBatch.mockResolvedValueOnce(["من Google"])

    const result = await translateBatch(["y"], "en", "ar")
    expect(result).toEqual(["من Google"])
    expect(getTranslationEngineState().google.state).toBe("closed")
  })

  it("passes opts.retry through to the provider", async () => {
    googleBatch.mockResolvedValueOnce(["ok"])

    await translateBatch(["hello"], "en", "ar", { retry: true })

    expect(googleBatch).toHaveBeenCalledWith(["hello"], "en", "ar", {
      retry: true,
    })
  })
})

describe("translateRaw chain", () => {
  it("returns empty string for empty text without calling providers", async () => {
    const result = await translateRaw("  ", "en", "ar")

    expect(result).toBe("")
    expect(googleRaw).not.toHaveBeenCalled()
    expect(groqRaw).not.toHaveBeenCalled()
  })

  it("falls back to Groq when Google fails", async () => {
    googleRaw.mockRejectedValueOnce(new Error("Google dead"))
    groqRaw.mockResolvedValueOnce("مرحبا")

    const result = await translateRaw("hello", "en", "ar")

    expect(result).toBe("مرحبا")
  })

  it("shares the breaker with batch calls (one dead provider, one circuit)", async () => {
    googleBatch.mockRejectedValue(new Error("dead"))
    groqBatch.mockResolvedValue(["x"])
    for (let i = 0; i < 3; i++) await translateBatch(["x"], "en", "ar")

    groqRaw.mockResolvedValueOnce("مرحبا")
    const result = await translateRaw("hello", "en", "ar")

    expect(result).toBe("مرحبا")
    expect(googleRaw).not.toHaveBeenCalled() // breaker already open from batch failures
  })
})
