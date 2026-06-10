// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { translateBatch, translateRaw } from "@/components/translation/google"

// Must import after mocking fetch
const mockFetch = vi.fn()
vi.stubGlobal("fetch", mockFetch)

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv("GOOGLE_TRANSLATE_API_KEY", "test-api-key")
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.useRealTimers()
})

/** A fetch mock that rejects with an AbortError the moment its signal fires. */
function abortableNeverResolves() {
  return (_url: string, init: { signal: AbortSignal }) =>
    new Promise((_resolve, reject) => {
      init.signal.addEventListener("abort", () => {
        reject(Object.assign(new Error("aborted"), { name: "AbortError" }))
      })
    })
}

describe("translateRaw", () => {
  // --- Missing API key ---

  it("throws error when GOOGLE_TRANSLATE_API_KEY is not set", async () => {
    vi.stubEnv("GOOGLE_TRANSLATE_API_KEY", "")

    await expect(translateRaw("hello", "en", "ar")).rejects.toThrow(
      "GOOGLE_TRANSLATE_API_KEY not configured"
    )
  })

  // --- Empty text ---

  it("returns empty string for empty text", async () => {
    const result = await translateRaw("", "en", "ar")
    expect(result).toBe("")
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("returns empty string for whitespace-only text", async () => {
    const result = await translateRaw("   ", "en", "ar")
    expect(result).toBe("")
    expect(mockFetch).not.toHaveBeenCalled()
  })

  // --- Successful translation ---

  it("translates text successfully via Google API", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          translations: [{ translatedText: "مرحبا" }],
        },
      }),
    })

    const result = await translateRaw("hello", "en", "ar")

    expect(result).toBe("مرحبا")
    expect(mockFetch).toHaveBeenCalledTimes(1)

    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toContain(
      "https://translation.googleapis.com/language/translate/v2"
    )
    expect(url).toContain("q=hello")
    expect(url).toContain("source=en")
    expect(url).toContain("target=ar")
    expect(url).toContain("key=test-api-key")
    expect(url).toContain("format=text")
    expect(options.method).toBe("POST")
  })

  // --- API error ---

  it("throws error when API response is not ok", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: async () => "Forbidden - invalid API key",
    })

    await expect(translateRaw("hello", "en", "ar")).rejects.toThrow(
      "Google Translate API error: 403 - Forbidden - invalid API key"
    )
  })

  it("throws error on 500 server error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => "Internal Server Error",
    })

    await expect(translateRaw("hello", "en", "ar")).rejects.toThrow(
      "Google Translate API error: 500 - Internal Server Error"
    )
  })

  // --- Response parsing ---

  it("returns empty string when translatedText is missing in response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          translations: [],
        },
      }),
    })

    const result = await translateRaw("hello", "en", "ar")
    expect(result).toBe("")
  })

  it("extracts translatedText from first translation in response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          translations: [
            { translatedText: "bonjour", detectedSourceLanguage: "en" },
          ],
        },
      }),
    })

    const result = await translateRaw("hello", "en", "fr")
    expect(result).toBe("bonjour")
  })

  // --- Timeout ---

  it("aborts and throws when the request exceeds the 2.5s timeout", async () => {
    vi.useFakeTimers()
    mockFetch.mockImplementation(abortableNeverResolves())

    const pending = translateRaw("hello", "en", "ar")
    // Surface the rejection without an unhandled-rejection warning.
    const assertion = expect(pending).rejects.toThrow(/timeout after 2500ms/)
    await vi.advanceTimersByTimeAsync(2500)
    await assertion
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  // --- Retry policy ---

  it("retries once on 429 when retry is enabled, then succeeds", async () => {
    vi.useFakeTimers()
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => "Rate limit exceeded",
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { translations: [{ translatedText: "مرحبا" }] },
        }),
      })

    const pending = translateRaw("hello", "en", "ar", { retry: true })
    await vi.advanceTimersByTimeAsync(250) // backoff
    const result = await pending

    expect(result).toBe("مرحبا")
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it("does NOT retry by default (one fetch, throws) on 429", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: async () => "Rate limit exceeded",
    })

    await expect(translateRaw("hello", "en", "ar")).rejects.toThrow(
      "Google Translate API error: 429"
    )
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it("does NOT retry a 400 bad-request even when retry is enabled", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => "Invalid source language",
    })

    await expect(
      translateRaw("hello", "en", "ar", { retry: true })
    ).rejects.toThrow("Google Translate API error: 400")
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})

describe("translateBatch", () => {
  // --- Missing API key ---

  it("throws error when GOOGLE_TRANSLATE_API_KEY is not set", async () => {
    vi.stubEnv("GOOGLE_TRANSLATE_API_KEY", "")

    await expect(translateBatch(["hello"], "en", "ar")).rejects.toThrow(
      "GOOGLE_TRANSLATE_API_KEY not configured"
    )
  })

  // --- All empty strings ---

  it("returns array of empty strings when all texts are empty", async () => {
    const result = await translateBatch(["", "  ", ""], "en", "ar")

    expect(result).toEqual(["", "", ""])
    expect(mockFetch).not.toHaveBeenCalled()
  })

  // --- Mixed empty and non-empty ---

  it("handles mixed empty and non-empty texts correctly", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          translations: [
            { translatedText: "مرحبا" },
            { translatedText: "عالم" },
          ],
        },
      }),
    })

    const result = await translateBatch(
      ["hello", "", "world", "  "],
      "en",
      "ar"
    )

    // Empty/whitespace positions remain empty, non-empty ones are translated
    expect(result).toEqual(["مرحبا", "", "عالم", ""])
  })

  // --- Batch API call with multiple q params ---

  it("sends multiple q parameters for batch texts", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          translations: [
            { translatedText: "مرحبا" },
            { translatedText: "عالم" },
            { translatedText: "اختبار" },
          ],
        },
      }),
    })

    await translateBatch(["hello", "world", "test"], "en", "ar")

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [url] = mockFetch.mock.calls[0]

    // Count how many q= params appear in the URL
    const qParams = (url as string).match(/q=/g)
    expect(qParams).toHaveLength(3)
    expect(url).toContain("q=hello")
    expect(url).toContain("q=world")
    expect(url).toContain("q=test")
  })

  // --- Successful batch translation ---

  it("translates a batch of texts successfully", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          translations: [
            { translatedText: "bonjour" },
            { translatedText: "monde" },
          ],
        },
      }),
    })

    const result = await translateBatch(["hello", "world"], "en", "fr")

    expect(result).toEqual(["bonjour", "monde"])
  })

  // --- API error in batch ---

  it("throws error when batch API response is not ok", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: async () => "Rate limit exceeded",
    })

    await expect(
      translateBatch(["hello", "world"], "en", "ar")
    ).rejects.toThrow("Google Translate API error: 429 - Rate limit exceeded")
  })

  // --- Missing translations in response ---

  it("returns empty string for missing translations in response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          translations: [
            { translatedText: "مرحبا" },
            // second translation missing
          ],
        },
      }),
    })

    const result = await translateBatch(["hello", "world"], "en", "ar")

    expect(result[0]).toBe("مرحبا")
    expect(result[1]).toBe("")
  })

  // --- Batch-size guard (chunking) ---

  it("splits batches over 100 items into exactly 2 requests (100 + 51), order preserved", async () => {
    const texts = Array.from({ length: 151 }, (_, i) => `word${i}`)
    mockFetch.mockImplementation(async (url: string) => {
      const qs = [...new URLSearchParams(String(url).split("?")[1]).entries()]
        .filter(([k]) => k === "q")
        .map(([, v]) => v)
      return {
        ok: true,
        json: async () => ({
          data: {
            translations: qs.map((q) => ({ translatedText: `T:${q}` })),
          },
        }),
      }
    })

    const result = await translateBatch(texts, "en", "ar")

    expect(mockFetch).toHaveBeenCalledTimes(2)
    // First request carries exactly 100 q params, second exactly 51.
    const countQ = (call: unknown[]) =>
      ((call[0] as string).match(/(?:^|&|\?)q=/g) ?? []).length
    expect(countQ(mockFetch.mock.calls[0])).toBe(100)
    expect(countQ(mockFetch.mock.calls[1])).toBe(51)
    expect(result).toHaveLength(151)
    expect(result[0]).toBe("T:word0")
    expect(result[99]).toBe("T:word99")
    expect(result[100]).toBe("T:word100")
    expect(result[150]).toBe("T:word150")
  })

  it("splits batches by cumulative characters (long texts), empties preserved", async () => {
    // Non-empty texts each ~1500 chars; 5 × 1500 = 7500 > 4000 → multiple chunks.
    // Interleave empties to assert positions still map back to "".
    const big = (i: number) => `${i}`.padEnd(1500, "x")
    const texts = [big(0), "", big(1), big(2), "  ", big(3), big(4)]
    mockFetch.mockImplementation(async (url: string) => {
      const qs = [...new URLSearchParams(String(url).split("?")[1]).entries()]
        .filter(([k]) => k === "q")
        .map(([, v]) => v)
      return {
        ok: true,
        json: async () => ({
          data: {
            translations: qs.map((q) => ({
              translatedText: `T:${q.slice(0, 1)}`,
            })),
          },
        }),
      }
    })

    const result = await translateBatch(texts, "en", "ar")

    expect(mockFetch.mock.calls.length).toBeGreaterThan(1)
    expect(result).toEqual(["T:0", "", "T:1", "T:2", "", "T:3", "T:4"])
  })

  it("keeps a small batch to exactly one request (no chunking regression)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          translations: [
            { translatedText: "مرحبا" },
            { translatedText: "عالم" },
          ],
        },
      }),
    })

    const result = await translateBatch(["hello", "world"], "en", "ar")

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(result).toEqual(["مرحبا", "عالم"])
  })

  // --- Timeout ---

  it("aborts and throws when a chunk request exceeds the 2.5s timeout", async () => {
    vi.useFakeTimers()
    mockFetch.mockImplementation(abortableNeverResolves())

    const pending = translateBatch(["hello", "world"], "en", "ar")
    const assertion = expect(pending).rejects.toThrow(/timeout after 2500ms/)
    await vi.advanceTimersByTimeAsync(2500)
    await assertion
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  // --- Retry policy ---

  it("retries a chunk once on 429 when retry is enabled, then succeeds", async () => {
    vi.useFakeTimers()
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => "Rate limit exceeded",
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            translations: [
              { translatedText: "مرحبا" },
              { translatedText: "عالم" },
            ],
          },
        }),
      })

    const pending = translateBatch(["hello", "world"], "en", "ar", {
      retry: true,
    })
    await vi.advanceTimersByTimeAsync(250) // backoff
    const result = await pending

    expect(result).toEqual(["مرحبا", "عالم"])
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it("does NOT retry by default (one fetch, throws) on 429", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: async () => "Rate limit exceeded",
    })

    await expect(translateBatch(["hello"], "en", "ar")).rejects.toThrow(
      "Google Translate API error: 429"
    )
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it("does NOT retry a 400 bad-request even when retry is enabled", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => "Invalid target language",
    })

    await expect(
      translateBatch(["hello"], "en", "ar", { retry: true })
    ).rejects.toThrow("Google Translate API error: 400")
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})
