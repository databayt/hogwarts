// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Provider-chained translation engine — THE import for every translation
 * consumer (localize / actions / prewarm / sweep). Nothing outside this file
 * should import google.ts or groq.ts directly.
 *
 * Chain: Google (quality, $20/M chars) → Groq LLM (free tier, fallback).
 * Each provider sits behind its own circuit breaker so a dead provider is
 * skipped instantly instead of taxing every render with its timeout:
 *
 *   - Google died 2026-06-14 (quota) and stayed dead for a month; before this
 *     file existed that meant EVERY page render burned a 2.5s Google timeout
 *     and then silently fell back to source text. Now the breaker opens after
 *     3 consecutive failures and renders go straight to Groq, probing Google
 *     again every 5 minutes.
 *   - If Groq also fails (rate limit, no key), callers keep their existing
 *     fallback-to-source behavior — the engine throws exactly like google.ts
 *     used to, so no caller changes semantics.
 *
 * Signatures are identical to google.ts, making this a drop-in replacement.
 */

import { CircuitBreaker, CircuitBreakerError } from "@/lib/circuit-breaker"

import {
  translateBatch as googleTranslateBatch,
  translateRaw as googleTranslateRaw,
} from "./google"
import { groqTranslateBatch, groqTranslateRaw } from "./groq"

// Quota outages last hours-to-weeks; probing every 5 minutes is cheap (one
// render pays one 2.5s timeout) and recovers promptly when billing is fixed.
const googleBreaker = new CircuitBreaker({
  name: "translate-google",
  failureThreshold: 3,
  cooldownMs: 5 * 60_000,
})

// Groq failures are usually per-minute rate limits — probe again sooner.
const groqBreaker = new CircuitBreaker({
  name: "translate-groq",
  failureThreshold: 3,
  cooldownMs: 2 * 60_000,
})

let _lastFallbackLogAt = 0
const FALLBACK_LOG_THROTTLE_MS = 5 * 60 * 1000

function logFallback(): void {
  const now = Date.now()
  if (now - _lastFallbackLogAt > FALLBACK_LOG_THROTTLE_MS) {
    _lastFallbackLogAt = now
    console.warn(
      "[translation-engine] Google unavailable — serving translations via Groq fallback"
    )
  }
}

/**
 * Pick the error worth surfacing: the original Google failure is the root
 * cause UNLESS the breaker was already open (then the Google error is just
 * "breaker open" noise and the Groq error carries the real information).
 */
function preferError(googleErr: unknown, groqErr: unknown): unknown {
  return googleErr instanceof CircuitBreakerError ? groqErr : googleErr
}

/** Batch translate through the provider chain. Contract = google.ts. */
export async function translateBatch(
  texts: string[],
  sourceLang: string,
  targetLang: string,
  opts?: { retry?: boolean }
): Promise<string[]> {
  // Nothing to translate — skip providers entirely (no key needed, no breaker noise).
  if (!texts.some((t) => t && t.trim() !== "")) return texts.map(() => "")

  let googleErr: unknown
  try {
    return await googleBreaker.execute(() =>
      googleTranslateBatch(texts, sourceLang, targetLang, opts)
    )
  } catch (err) {
    googleErr = err
  }

  try {
    const result = await groqBreaker.execute(() =>
      groqTranslateBatch(texts, sourceLang, targetLang, opts)
    )
    logFallback()
    return result
  } catch (groqErr) {
    throw preferError(googleErr, groqErr)
  }
}

/** Single-text translate through the provider chain. Contract = google.ts. */
export async function translateRaw(
  text: string,
  sourceLang: string,
  targetLang: string,
  opts?: { retry?: boolean }
): Promise<string> {
  if (!text || text.trim() === "") return ""

  let googleErr: unknown
  try {
    return await googleBreaker.execute(() =>
      googleTranslateRaw(text, sourceLang, targetLang, opts)
    )
  } catch (err) {
    googleErr = err
  }

  try {
    const result = await groqBreaker.execute(() =>
      groqTranslateRaw(text, sourceLang, targetLang, opts)
    )
    logFallback()
    return result
  } catch (groqErr) {
    throw preferError(googleErr, groqErr)
  }
}

/** Breaker states for health checks / the sweep report. */
export function getTranslationEngineState(): {
  google: ReturnType<CircuitBreaker["getState"]>
  groq: ReturnType<CircuitBreaker["getState"]>
} {
  return { google: googleBreaker.getState(), groq: groqBreaker.getState() }
}

/** Test/ops hook — module-level breakers otherwise bleed state across tests. */
export function resetTranslationEngine(): void {
  googleBreaker.reset()
  groqBreaker.reset()
}
