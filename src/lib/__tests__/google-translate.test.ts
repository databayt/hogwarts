import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { googleTranslate, googleTranslateBatch } from "@/lib/google-translate"

// Must import after mocking fetch
const mockFetch = vi.fn()
vi.stubGlobal("fetch", mockFetch)

// Store and restore original env
const originalEnv = process.env.GOOGLE_TRANSLATE_API_KEY

describe("googleTranslate", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.GOOGLE_TRANSLATE_API_KEY = "test-api-key"
  })

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.GOOGLE_TRANSLATE_API_KEY = originalEnv
    } else {
      delete process.env.GOOGLE_TRANSLATE_API_KEY
    }
  })

  // --- Missing API key ---

  it("throws error when GOOGLE_TRANSLATE_API_KEY is not set", async () => {
    delete process.env.GOOGLE_TRANSLATE_API_KEY

    await expect(googleTranslate("hello", "en", "ar")).rejects.toThrow(
      "GOOGLE_TRANSLATE_API_KEY not configured"
    )
  })

  // --- Empty text ---

  it("returns empty string for empty text", async () => {
    const result = await googleTranslate("", "en", "ar")
    expect(result).toBe("")
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("returns empty string for whitespace-only text", async () => {
    const result = await googleTranslate("   ", "en", "ar")
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

    const result = await googleTranslate("hello", "en", "ar")

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

    await expect(googleTranslate("hello", "en", "ar")).rejects.toThrow(
      "Google Translate API error: 403 - Forbidden - invalid API key"
    )
  })

  it("throws error on 500 server error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => "Internal Server Error",
    })

    await expect(googleTranslate("hello", "en", "ar")).rejects.toThrow(
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

    const result = await googleTranslate("hello", "en", "ar")
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

    const result = await googleTranslate("hello", "en", "fr")
    expect(result).toBe("bonjour")
  })
})

describe("googleTranslateBatch", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.GOOGLE_TRANSLATE_API_KEY = "test-api-key"
  })

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.GOOGLE_TRANSLATE_API_KEY = originalEnv
    } else {
      delete process.env.GOOGLE_TRANSLATE_API_KEY
    }
  })

  // --- Missing API key ---

  it("throws error when GOOGLE_TRANSLATE_API_KEY is not set", async () => {
    delete process.env.GOOGLE_TRANSLATE_API_KEY

    await expect(googleTranslateBatch(["hello"], "en", "ar")).rejects.toThrow(
      "GOOGLE_TRANSLATE_API_KEY not configured"
    )
  })

  // --- All empty strings ---

  it("returns array of empty strings when all texts are empty", async () => {
    const result = await googleTranslateBatch(["", "  ", ""], "en", "ar")

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

    const result = await googleTranslateBatch(
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

    await googleTranslateBatch(["hello", "world", "test"], "en", "ar")

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

    const result = await googleTranslateBatch(["hello", "world"], "en", "fr")

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
      googleTranslateBatch(["hello", "world"], "en", "ar")
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

    const result = await googleTranslateBatch(["hello", "world"], "en", "ar")

    expect(result[0]).toBe("مرحبا")
    expect(result[1]).toBe("")
  })
})
