"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Google Cloud Translation API v2 wrapper
 * Provides batch translation support with error handling
 *
 * Env var: GOOGLE_TRANSLATE_API_KEY
 * Free tier: 500K chars/month
 */
import { GOOGLE_TRANSLATE_API_URL } from "./config"
import type { TranslateResponse } from "./types"

/**
 * Loud-but-throttled degradation signal.
 *
 * Both `getText` and `translate` callers `catch -> return source text`,
 * which is correct for UX but historically meant a missing/failing API key produced
 * "everything is Arabic on /en" with ZERO log signal — indistinguishable from a page
 * that simply wasn't wired. We surface it here so it reaches Vercel runtime logs,
 * without spamming once per row.
 */
let _lastDegradedLogAt = 0
const DEGRADED_LOG_THROTTLE_MS = 5 * 60 * 1000

function reportTranslationDegraded(reason: string): void {
  const now = Date.now()
  if (now - _lastDegradedLogAt > DEGRADED_LOG_THROTTLE_MS) {
    _lastDegradedLogAt = now
    console.error(
      `[translation] DEGRADED — display text is falling back to source/transliteration. Reason: ${reason}`
    )
  }
}

// Network hardening. The read path (`localize` → `getText`) blocks renders on
// these calls, so a hung Google socket must not hang the whole page: we cap each
// request and, on the OFF-render-path prewarm only, allow a single retry.
const TIMEOUT_MS = 2500
const RETRY_BACKOFF_MS = 250

/**
 * Error carrying the HTTP status (when there is a response) so the retry policy
 * can distinguish transient failures (429/5xx/abort/network) from permanent
 * client errors (400 bad input, 403 bad key) that must never be retried.
 * `status` is undefined for abort/timeout and network-level failures.
 */
class GoogleTranslateError extends Error {
  readonly status?: number
  readonly transient: boolean
  constructor(message: string, opts: { status?: number; transient: boolean }) {
    super(message)
    this.name = "GoogleTranslateError"
    this.status = opts.status
    this.transient = opts.transient
  }
}

/**
 * POST to the Google Translate endpoint with a hard timeout, returning the
 * parsed JSON. Non-2xx and abort/timeout both `reportTranslationDegraded` and
 * throw a `GoogleTranslateError` tagged `transient` for the retry policy.
 *
 * Shared by both exported functions so the timeout + classification live in one
 * place. `params` already carries q/source/target/key/format.
 */
async function requestTranslate(
  params: URLSearchParams
): Promise<TranslateResponse> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  let response: Response
  try {
    response = await fetch(`${GOOGLE_TRANSLATE_API_URL}?${params}`, {
      method: "POST",
      signal: controller.signal,
    })
  } catch (err) {
    // Abort (timeout) or a network-level TypeError — both transient.
    const aborted =
      controller.signal.aborted ||
      (err instanceof Error && err.name === "AbortError")
    if (aborted) {
      reportTranslationDegraded(
        `Google Translate timeout after ${TIMEOUT_MS}ms`
      )
      throw new GoogleTranslateError(
        `Google Translate timeout after ${TIMEOUT_MS}ms`,
        { transient: true }
      )
    }
    reportTranslationDegraded(
      `Google Translate network error: ${err instanceof Error ? err.message : String(err)}`
    )
    throw new GoogleTranslateError(
      `Google Translate network error: ${err instanceof Error ? err.message : String(err)}`,
      { transient: true }
    )
  } finally {
    clearTimeout(timer)
  }

  if (!response.ok) {
    const error = await response.text()
    reportTranslationDegraded(
      `Google Translate API ${response.status}: ${error.slice(0, 200)}`
    )
    // Retry 429, 5xx, and 403 rate-limit throttles. Google returns
    // "userRateLimitExceeded" / "rateLimitExceeded" as 403 — a throttle, not a
    // permanent client error (a bad key/permission is also 403 but carries no
    // rateLimit reason), so it must stay retryable. Other 4xx are permanent.
    const isRateLimit403 =
      response.status === 403 && /rateLimitExceeded/i.test(error)
    const transient =
      response.status === 429 || response.status >= 500 || isRateLimit403
    throw new GoogleTranslateError(
      `Google Translate API error: ${response.status} - ${error}`,
      { status: response.status, transient }
    )
  }

  return (await response.json()) as TranslateResponse
}

/**
 * Run `requestTranslate`, retrying ONCE after `RETRY_BACKOFF_MS` when
 * `opts.retry` is set AND the failure is transient (429 / 5xx / abort / network).
 * Permanent client errors (400/403) and the no-retry default fail fast so the
 * caller can fall back to source text without delaying the render.
 */
async function requestTranslateWithPolicy(
  params: URLSearchParams,
  opts?: { retry?: boolean }
): Promise<TranslateResponse> {
  try {
    return await requestTranslate(params)
  } catch (err) {
    const transient = err instanceof GoogleTranslateError && err.transient
    if (!opts?.retry || !transient) throw err
    await new Promise((resolve) => setTimeout(resolve, RETRY_BACKOFF_MS))
    return await requestTranslate(params)
  }
}

/**
 * Translate a single text using Google Cloud Translation API.
 *
 * `opts.retry` (default false) enables a single transient-failure retry — leave
 * it off on the read path, which must fail fast to its source-text fallback.
 */
export async function translateRaw(
  text: string,
  sourceLang: string,
  targetLang: string,
  opts?: { retry?: boolean }
): Promise<string> {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY
  if (!apiKey) {
    reportTranslationDegraded("GOOGLE_TRANSLATE_API_KEY is not configured")
    throw new Error("GOOGLE_TRANSLATE_API_KEY not configured")
  }

  if (!text || text.trim() === "") return ""

  const params = new URLSearchParams({
    q: text,
    source: sourceLang,
    target: targetLang,
    key: apiKey,
    format: "text",
  })

  const result = await requestTranslateWithPolicy(params, opts)
  return result.data.translations[0]?.translatedText ?? ""
}

// Google v2 caps a request at 128 `q` segments; we also send params in the
// URL (POST with query string), so cumulative characters are bounded to stay
// well under URL-length limits. Oversized batches are chunked transparently.
const BATCH_MAX_ITEMS = 100
const BATCH_MAX_CHARS = 4_000

/**
 * Batch translate multiple texts.
 * One API call for typical pages; transparently splits into sequential
 * chunked calls when the batch exceeds Google's per-request limits.
 * Results always map back to the original positions.
 *
 * `opts.retry` (default false) enables a single transient-failure retry PER
 * chunk — used by `prewarm` (which runs off the response path via `after()`).
 * The read path leaves it off so a transient failure falls back fast.
 */
export async function translateBatch(
  texts: string[],
  sourceLang: string,
  targetLang: string,
  opts?: { retry?: boolean }
): Promise<string[]> {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY
  if (!apiKey) {
    reportTranslationDegraded("GOOGLE_TRANSLATE_API_KEY is not configured")
    throw new Error("GOOGLE_TRANSLATE_API_KEY not configured")
  }

  const nonEmpty = texts.filter((t) => t && t.trim() !== "")
  if (nonEmpty.length === 0) return texts.map(() => "")

  // Split the non-empty texts into chunks under both limits.
  const chunks: string[][] = []
  let current: string[] = []
  let currentChars = 0
  for (const text of nonEmpty) {
    if (
      current.length > 0 &&
      (current.length >= BATCH_MAX_ITEMS ||
        currentChars + text.length > BATCH_MAX_CHARS)
    ) {
      chunks.push(current)
      current = []
      currentChars = 0
    }
    current.push(text)
    currentChars += text.length
  }
  if (current.length > 0) chunks.push(current)

  const translations: string[] = []
  for (const chunk of chunks) {
    const params = new URLSearchParams({
      source: sourceLang,
      target: targetLang,
      key: apiKey,
      format: "text",
    })
    for (const text of chunk) params.append("q", text)

    const result = await requestTranslateWithPolicy(params, opts)
    const chunkTranslations = result.data.translations
    for (let i = 0; i < chunk.length; i++) {
      translations.push(chunkTranslations[i]?.translatedText ?? "")
    }
  }

  // Map back to original positions (empty strings stay empty)
  let translationIndex = 0
  return texts.map((text) => {
    if (!text || text.trim() === "") return ""
    return translations[translationIndex++] ?? ""
  })
}
