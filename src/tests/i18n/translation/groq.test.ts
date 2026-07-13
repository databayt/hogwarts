// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Groq fallback-provider tests: JSON batch protocol, count validation,
 * blank-item substitution, chunking, empty-input mapping, error policy.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  groqTranslateBatch,
  groqTranslateRaw,
  isGroqConfigured,
} from "@/components/translation/groq"

const mockFetch = vi.fn()
vi.stubGlobal("fetch", mockFetch)

/** Keyed-object reply: {"0": items[0], "1": items[1], …} — the wire protocol. */
function groqOk(items: string[]) {
  return {
    ok: true,
    json: async () => ({
      choices: [
        {
          message: {
            content: JSON.stringify(
              Object.fromEntries(items.map((t, i) => [String(i), t]))
            ),
          },
        },
      ],
    }),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv("GROQ_API_KEY", "test-groq-key")
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.useRealTimers()
})

describe("isGroqConfigured", () => {
  it("reflects GROQ_API_KEY presence", () => {
    expect(isGroqConfigured()).toBe(true)
    vi.stubEnv("GROQ_API_KEY", "")
    expect(isGroqConfigured()).toBe(false)
  })
})

describe("groqTranslateBatch", () => {
  it("throws when GROQ_API_KEY is not set", async () => {
    vi.stubEnv("GROQ_API_KEY", "")

    await expect(groqTranslateBatch(["hello"], "en", "ar")).rejects.toThrow(
      "GROQ_API_KEY not configured"
    )
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("returns empty strings for all-empty input without an API call", async () => {
    const result = await groqTranslateBatch(["", "  "], "en", "ar")

    expect(result).toEqual(["", ""])
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("translates a batch and maps empties back to their positions", async () => {
    mockFetch.mockResolvedValueOnce(groqOk(["مرحبا", "عالم"]))

    const result = await groqTranslateBatch(
      ["hello", "", "world", " "],
      "en",
      "ar"
    )

    expect(result).toEqual(["مرحبا", "", "عالم", ""])
    expect(mockFetch).toHaveBeenCalledTimes(1)

    const [url, init] = mockFetch.mock.calls[0]
    expect(url).toBe("https://api.groq.com/openai/v1/chat/completions")
    const body = JSON.parse(init.body)
    expect(body.temperature).toBe(0)
    expect(body.response_format).toEqual({ type: "json_object" })
    expect(JSON.parse(body.messages[1].content)).toEqual({
      "0": "hello",
      "1": "world",
    })
    expect(init.headers.Authorization).toBe("Bearer test-groq-key")
  })

  it("substitutes the SOURCE string when the model blanks an item (never ships '')", async () => {
    mockFetch.mockResolvedValueOnce(groqOk(["مرحبا", ""]))

    const result = await groqTranslateBatch(["hello", "world"], "en", "ar")

    expect(result).toEqual(["مرحبا", "world"])
  })

  it("throws when most keys are missing from the reply (caller falls back to source)", async () => {
    mockFetch.mockResolvedValueOnce(groqOk(["فقط واحد"])) // keys "1","2" missing

    await expect(
      groqTranslateBatch(["hello", "world", "again"], "en", "ar")
    ).rejects.toThrow("Groq item-count mismatch")
  })

  it("throws on non-JSON content", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "Sure! Here are the translations…" } }],
      }),
    })

    await expect(groqTranslateBatch(["hello"], "en", "ar")).rejects.toThrow(
      "Groq returned non-JSON content"
    )
  })

  it("parses content wrapped in markdown fences (defensive)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '```json\n{"0":"مرحبا"}\n```' } }],
      }),
    })

    const result = await groqTranslateBatch(["hello"], "en", "ar")
    expect(result).toEqual(["مرحبا"])
  })

  it("throws on HTTP error with status detail", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: async () => "rate limit exceeded",
    })

    await expect(groqTranslateBatch(["hello"], "en", "ar")).rejects.toThrow(
      "Groq API error: 429"
    )
  })

  it("retries once on 429 when retry is enabled, then succeeds", async () => {
    vi.useFakeTimers()
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => "rate limit",
      })
      .mockResolvedValueOnce(groqOk(["مرحبا"]))

    const pending = groqTranslateBatch(["hello"], "en", "ar", { retry: true })
    await vi.advanceTimersByTimeAsync(500) // backoff
    const result = await pending

    expect(result).toEqual(["مرحبا"])
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it("does NOT retry a 401 permanent error even with retry enabled", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => "invalid key",
    })

    await expect(
      groqTranslateBatch(["hello"], "en", "ar", { retry: true })
    ).rejects.toThrow("Groq API error: 401")
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it("chunks batches over 40 items into multiple requests, order preserved", async () => {
    const texts = Array.from({ length: 55 }, (_, i) => `word${i}`)
    mockFetch.mockImplementation(
      async (_url: string, init: { body: string }) => {
        const keyed = JSON.parse(
          JSON.parse(init.body).messages[1].content
        ) as Record<string, string>
        return groqOk(Object.values(keyed).map((q) => `T:${q}`))
      }
    )

    const result = await groqTranslateBatch(texts, "en", "ar")

    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(result).toHaveLength(55)
    expect(result[0]).toBe("T:word0")
    expect(result[54]).toBe("T:word54")
  })

  it("aborts and throws when the request exceeds the 10s timeout", async () => {
    vi.useFakeTimers()
    mockFetch.mockImplementation(
      (_url: string, init: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          init.signal.addEventListener("abort", () => {
            reject(Object.assign(new Error("aborted"), { name: "AbortError" }))
          })
        })
    )

    const pending = groqTranslateBatch(["hello"], "en", "ar")
    const assertion = expect(pending).rejects.toThrow(/timeout after 10000ms/)
    await vi.advanceTimersByTimeAsync(10_000)
    await assertion
  })
})

describe("groqTranslateRaw", () => {
  it("returns empty string for empty text", async () => {
    const result = await groqTranslateRaw("", "en", "ar")
    expect(result).toBe("")
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("translates a single text through the batch path", async () => {
    mockFetch.mockResolvedValueOnce(groqOk(["الرياضيات"]))

    const result = await groqTranslateRaw("Mathematics", "en", "ar")
    expect(result).toBe("الرياضيات")
  })
})
