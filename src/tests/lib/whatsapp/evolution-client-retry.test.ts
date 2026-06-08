// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// Set env before importing the module so the module-load-time env read
// captures real values, not the default empty strings.
const ORIGINAL_URL = process.env.EVOLUTION_API_URL
const ORIGINAL_KEY = process.env.EVOLUTION_API_KEY

beforeEach(() => {
  process.env.EVOLUTION_API_URL = "https://evolution.test"
  process.env.EVOLUTION_API_KEY = "test-api-key"
  vi.resetModules()
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
  if (ORIGINAL_URL !== undefined) process.env.EVOLUTION_API_URL = ORIGINAL_URL
  else delete process.env.EVOLUTION_API_URL
  if (ORIGINAL_KEY !== undefined) process.env.EVOLUTION_API_KEY = ORIGINAL_KEY
  else delete process.env.EVOLUTION_API_KEY
})

function stubFetchSequence(responses: Array<Response | Error>) {
  let i = 0
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      const r = responses[i++]
      if (!r) throw new Error("fetch called more times than stubbed")
      if (r instanceof Error) throw r
      return r
    })
  )
}

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "content-type": "application/json", ...init.headers },
  })
}

function errResponse(status: number, body = "boom"): Response {
  return new Response(body, { status })
}

// ---------------------------------------------------------------------------
// isRetryableError predicate
// ---------------------------------------------------------------------------

describe("evolution-client — isRetryableError", () => {
  it("retries on 5xx, 408, 429 — but not 4xx", async () => {
    const mod = await import("@/lib/whatsapp/evolution-client")
    const { isRetryableError, EvolutionAPIError } = mod.__testing
    const cases: Array<[number, boolean]> = [
      [500, true],
      [502, true],
      [503, true],
      [504, true],
      [408, true],
      [425, true],
      [429, true],
      [400, false],
      [401, false],
      [403, false],
      [404, false],
      [409, false],
      [422, false],
    ]
    for (const [status, expected] of cases) {
      const err = new EvolutionAPIError(status, "x")
      expect(isRetryableError(err), `status ${status}`).toBe(expected)
    }
  })

  it("retries on TypeError (fetch network failure)", async () => {
    const { isRetryableError } = (
      await import("@/lib/whatsapp/evolution-client")
    ).__testing
    expect(isRetryableError(new TypeError("fetch failed"))).toBe(true)
  })

  it("retries on AbortError (per-attempt timeout)", async () => {
    const { isRetryableError } = (
      await import("@/lib/whatsapp/evolution-client")
    ).__testing
    const err = new DOMException("aborted", "AbortError")
    expect(isRetryableError(err)).toBe(true)
  })

  it("does NOT retry on generic Errors", async () => {
    const { isRetryableError } = (
      await import("@/lib/whatsapp/evolution-client")
    ).__testing
    expect(isRetryableError(new Error("anything else"))).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// backoffWithJitter
// ---------------------------------------------------------------------------

describe("evolution-client — backoffWithJitter", () => {
  it("produces exponential growth: ~200, ~400, ~800 with ±25% jitter", async () => {
    const { backoffWithJitter } = (
      await import("@/lib/whatsapp/evolution-client")
    ).__testing
    for (let attempt = 0; attempt < 3; attempt++) {
      const base = 200 * Math.pow(2, attempt) // 200, 400, 800
      const samples = Array.from({ length: 50 }, () =>
        backoffWithJitter(attempt, 200)
      )
      const min = Math.min(...samples)
      const max = Math.max(...samples)
      // Jitter is ±25%, so every sample stays within that envelope.
      expect(min).toBeGreaterThanOrEqual(Math.floor(base * 0.75))
      expect(max).toBeLessThanOrEqual(Math.ceil(base * 1.25))
    }
  })

  it("never returns a negative delay", async () => {
    const { backoffWithJitter } = (
      await import("@/lib/whatsapp/evolution-client")
    ).__testing
    for (let i = 0; i < 100; i++) {
      expect(backoffWithJitter(0, 0)).toBeGreaterThanOrEqual(0)
    }
  })
})

// ---------------------------------------------------------------------------
// sendText end-to-end via the retry wrapper
// ---------------------------------------------------------------------------

describe("evolution-client — request() retry behavior via sendText", () => {
  it("succeeds on first try without sleeping (no retry overhead on the happy path)", async () => {
    stubFetchSequence([jsonResponse({ key: { id: "msg-1" } })])
    const { sendText } = await import("@/lib/whatsapp/evolution-client")
    const result = await sendText("instance-1", "1234567890", "hello")
    expect(result).toMatchObject({ key: { id: "msg-1" } })
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1)
  })

  it("retries a 502 and succeeds on the second attempt", async () => {
    stubFetchSequence([errResponse(502), jsonResponse({ key: { id: "ok" } })])
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {})

    const { sendText } = await import("@/lib/whatsapp/evolution-client")
    const promise = sendText("instance-1", "1234567890", "hi")
    // Drive the backoff timer so the second attempt fires.
    await vi.advanceTimersByTimeAsync(2_000)
    const result = await promise

    expect(result).toMatchObject({ key: { id: "ok" } })
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2)
    expect(consoleWarn).toHaveBeenCalledTimes(1)
    consoleWarn.mockRestore()
  })

  it("retries up to 3 attempts then throws when every attempt 502s", async () => {
    stubFetchSequence([errResponse(502), errResponse(502), errResponse(502)])
    vi.spyOn(console, "warn").mockImplementation(() => {})

    const { sendText } = await import("@/lib/whatsapp/evolution-client")
    const promise = sendText("instance-1", "1234567890", "hi")
    const expectation = expect(promise).rejects.toThrow(/Evolution API 502/)
    await vi.advanceTimersByTimeAsync(5_000)
    await expectation

    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(3)
  })

  it("does NOT retry on a 401 — throws immediately (auth issue, fixing won't help)", async () => {
    stubFetchSequence([errResponse(401, "missing apikey")])

    const { sendText } = await import("@/lib/whatsapp/evolution-client")
    await expect(sendText("instance-1", "1234567890", "hi")).rejects.toThrow(
      /Evolution API 401/
    )

    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1)
  })

  it("retries on a TypeError (network failure) and succeeds on retry", async () => {
    stubFetchSequence([
      new TypeError("fetch failed"),
      jsonResponse({ key: { id: "ok" } }),
    ])
    vi.spyOn(console, "warn").mockImplementation(() => {})

    const { sendText } = await import("@/lib/whatsapp/evolution-client")
    const promise = sendText("instance-1", "1234567890", "hi")
    await vi.advanceTimersByTimeAsync(2_000)
    const result = await promise

    expect(result).toMatchObject({ key: { id: "ok" } })
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2)
  })
})
