// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Groq LLM translation provider — the FALLBACK behind Google in engine.ts.
 *
 * Exists because a single dead provider must never again silently kill
 * translations platform-wide (Google's quota died 2026-06-14 and every page
 * fell back to source text for a month with no recovery path). Groq's free
 * tier (llama-3.1-8b-instant) translates short UI strings — names, subject
 * titles, labels — with more than acceptable quality.
 *
 * Contract mirrors google.ts exactly (same signatures, same empty-string
 * mapping, same transient/permanent error split) so engine.ts can treat the
 * two providers interchangeably.
 *
 * Env vars: GROQ_API_KEY (required), GROQ_TRANSLATE_MODEL (optional override).
 */

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
const DEFAULT_MODEL = "llama-3.1-8b-instant"

// LLM batches are kept smaller than Google's (40/3000 vs 100/4000): the model
// must echo every item back in order, and reliability drops as batches grow.
const BATCH_MAX_ITEMS = 40
const BATCH_MAX_CHARS = 3_000

// LLM completion latency is higher than Google's REST endpoint. This path only
// runs when Google already failed, so the render is degraded either way —
// prefer a slower correct translation over an instant source-text fallback.
const TIMEOUT_MS = 10_000
const RETRY_BACKOFF_MS = 500

const LANG_NAMES: Record<string, string> = {
  ar: "Arabic",
  en: "English",
}

/** Same loud-but-throttled degradation signal pattern as google.ts. */
let _lastDegradedLogAt = 0
const DEGRADED_LOG_THROTTLE_MS = 5 * 60 * 1000

function reportGroqDegraded(reason: string): void {
  const now = Date.now()
  if (now - _lastDegradedLogAt > DEGRADED_LOG_THROTTLE_MS) {
    _lastDegradedLogAt = now
    console.error(
      `[translation] GROQ FALLBACK DEGRADED — last-resort provider failing too. Reason: ${reason}`
    )
  }
}

class GroqTranslateError extends Error {
  readonly status?: number
  readonly transient: boolean
  /** Server-suggested wait before retrying (429 rate limits). */
  readonly retryAfterMs?: number
  constructor(
    message: string,
    opts: { status?: number; transient: boolean; retryAfterMs?: number }
  ) {
    super(message)
    this.name = "GroqTranslateError"
    this.status = opts.status
    this.transient = opts.transient
    this.retryAfterMs = opts.retryAfterMs
  }
}

export function isGroqConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY)
}

interface GroqChatResponse {
  choices?: Array<{ message?: { content?: string } }>
}

/**
 * One chat-completion call translating `chunk` (all non-empty). Returns the
 * translations in order. Throws GroqTranslateError on HTTP/timeout/format
 * failures, tagged transient/permanent for the retry policy.
 */
async function requestChunk(
  chunk: string[],
  sourceLang: string,
  targetLang: string
): Promise<string[]> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    reportGroqDegraded("GROQ_API_KEY is not configured")
    throw new GroqTranslateError("GROQ_API_KEY not configured", {
      transient: false,
    })
  }

  const source = LANG_NAMES[sourceLang] ?? sourceLang
  const target = LANG_NAMES[targetLang] ?? targetLang

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  // Keyed-object protocol: {"0": text, "1": text} in → same keys out. Far more
  // robust than a parallel array — models drop/merge array items on longer
  // texts (seen as Groq-side json_validate_failed on announcement bodies),
  // but they reliably echo an object's keys.
  const keyed = Object.fromEntries(chunk.map((t, i) => [String(i), t]))
  let response: Response
  try {
    response = await fetch(GROQ_API_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.GROQ_TRANSLATE_MODEL ?? DEFAULT_MODEL,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              `You are a translation engine for a school platform. The user sends a JSON object whose values are strings in ${source}. ` +
              `Reply with ONLY a JSON object having EXACTLY the same keys, where each value is the ${target} translation of the input value at that key. ` +
              `Example: input {"0":"hello","1":"world"} → output {"0":"مرحبا","1":"عالم"}. ` +
              `Transliterate person names phonetically (do not translate their meaning). ` +
              `Keep numbers, room codes (like B102), emails, URLs and {{placeholders}} unchanged. ` +
              `If a value is already in ${target} or untranslatable, return it unchanged.`,
          },
          { role: "user", content: JSON.stringify(keyed) },
        ],
      }),
    })
  } catch (err) {
    const aborted =
      controller.signal.aborted ||
      (err instanceof Error && err.name === "AbortError")
    const reason = aborted
      ? `Groq timeout after ${TIMEOUT_MS}ms`
      : `Groq network error: ${err instanceof Error ? err.message : String(err)}`
    reportGroqDegraded(reason)
    throw new GroqTranslateError(reason, { transient: true })
  } finally {
    clearTimeout(timer)
  }

  if (!response.ok) {
    const error = await response.text()
    reportGroqDegraded(`Groq API ${response.status}: ${error.slice(0, 200)}`)
    const transient = response.status === 429 || response.status >= 500
    // Groq 429s carry the wait both in a retry-after header and in the body
    // ("Please try again in 1.29s") — surface it so callers pace themselves
    // instead of hammering the TPM window.
    let retryAfterMs: number | undefined
    if (response.status === 429) {
      const header = Number(response.headers?.get?.("retry-after"))
      if (Number.isFinite(header) && header > 0) retryAfterMs = header * 1000
      else {
        const m = /try again in (\d+(?:\.\d+)?)s/.exec(error)
        if (m) retryAfterMs = Math.ceil(Number(m[1]) * 1000)
      }
    }
    throw new GroqTranslateError(
      `Groq API error: ${response.status} - ${error.slice(0, 500)}`,
      { status: response.status, transient, retryAfterMs }
    )
  }

  const json = (await response.json()) as GroqChatResponse
  const content = json.choices?.[0]?.message?.content ?? ""

  let parsed: unknown
  try {
    // json_object mode shouldn't emit fences, but strip defensively.
    parsed = JSON.parse(content.replace(/^```(?:json)?\s*|\s*```$/g, ""))
  } catch {
    reportGroqDegraded("Groq returned non-JSON content")
    throw new GroqTranslateError("Groq returned non-JSON content", {
      transient: true,
    })
  }

  const record = parsed as Record<string, unknown>
  const items = chunk.map((_src, i) => record[String(i)])
  const missing = items.filter(
    (item) => typeof item !== "string" || item.trim() === ""
  ).length
  // Tolerate a few blanks (substituted with source below) but treat a mostly
  // empty reply as a failed generation so the retry policy can take over.
  if (missing > Math.max(1, Math.floor(chunk.length / 3))) {
    reportGroqDegraded(
      `Groq keyed-reply mismatch (${missing}/${chunk.length} keys missing)`
    )
    throw new GroqTranslateError("Groq item-count mismatch", {
      transient: true,
    })
  }

  // An LLM occasionally blanks an item — substitute the source string so a
  // blank never reaches the UI (localize would render "" verbatim).
  return items.map((item, i) =>
    typeof item === "string" && item.trim() !== "" ? item : chunk[i]
  )
}

/**
 * Run one chunk, retrying ONCE on transient failure when opts.retry is set.
 * A 429 waits the server-suggested interval (capped at 15s) instead of the
 * fixed backoff, so paced batch jobs ride the TPM window instead of failing.
 */
async function requestChunkWithPolicy(
  chunk: string[],
  sourceLang: string,
  targetLang: string,
  opts?: { retry?: boolean }
): Promise<string[]> {
  try {
    return await requestChunk(chunk, sourceLang, targetLang)
  } catch (err) {
    const transient = err instanceof GroqTranslateError && err.transient
    if (!opts?.retry || !transient) throw err
    const wait = Math.min(
      err instanceof GroqTranslateError && err.retryAfterMs
        ? err.retryAfterMs + 250
        : RETRY_BACKOFF_MS,
      15_000
    )
    await new Promise((resolve) => setTimeout(resolve, wait))
    return await requestChunk(chunk, sourceLang, targetLang)
  }
}

/**
 * Batch translate via Groq. Same contract as google.ts translateBatch:
 * empty/whitespace inputs map back to "" in their original positions,
 * oversized batches are chunked transparently.
 */
export async function groqTranslateBatch(
  texts: string[],
  sourceLang: string,
  targetLang: string,
  opts?: { retry?: boolean }
): Promise<string[]> {
  const nonEmpty = texts.filter((t) => t && t.trim() !== "")
  if (nonEmpty.length === 0) return texts.map(() => "")

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
    const result = await requestChunkWithPolicy(
      chunk,
      sourceLang,
      targetLang,
      opts
    )
    translations.push(...result)
  }

  let translationIndex = 0
  return texts.map((text) => {
    if (!text || text.trim() === "") return ""
    return translations[translationIndex++] ?? ""
  })
}

/** Single-text convenience wrapper. Same contract as google.ts translateRaw. */
export async function groqTranslateRaw(
  text: string,
  sourceLang: string,
  targetLang: string,
  opts?: { retry?: boolean }
): Promise<string> {
  if (!text || text.trim() === "") return ""
  const [translated] = await groqTranslateBatch(
    [text],
    sourceLang,
    targetLang,
    opts
  )
  return translated ?? ""
}
