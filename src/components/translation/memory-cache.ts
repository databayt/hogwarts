// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Lang } from "./types"

/**
 * Process-level LRU glossary for HOT, repeated short terms — subject names,
 * grade labels, statuses, room types. These appear on nearly every page; caching
 * them in memory means a warm server instance answers them with ZERO database
 * round-trips. Long bodies (announcements, descriptions) are intentionally NOT
 * cached here — they're low-repetition and would bloat memory; they fall through
 * to the per-school DB cache.
 *
 * Dependency-free LRU: a `Map` keeps insertion order, so "touch on read" (delete
 * + re-set) makes the first key the least-recently-used; we evict it past cap.
 * Per-instance only (Vercel runs many short-lived instances) — correctness never
 * depends on it; it's a pure latency win in front of the durable DB cache.
 */

const MAX_ENTRIES = 5_000
const MAX_LEN = 120 // only "hot terms"; longer strings skip the in-memory layer

const store = new Map<string, string>()

const SEP = " "
function keyOf(schoolId: string, from: Lang, to: Lang, src: string): string {
  return schoolId + SEP + from + SEP + to + SEP + src
}

/** Whether a string is short enough to live in the hot-term cache. */
export function isHotTerm(text: string): boolean {
  return text.length <= MAX_LEN
}

export function memoGet(
  schoolId: string,
  from: Lang,
  to: Lang,
  src: string
): string | undefined {
  if (src.length > MAX_LEN) return undefined
  const k = keyOf(schoolId, from, to, src)
  const v = store.get(k)
  if (v === undefined) return undefined
  // LRU touch — move to most-recently-used end.
  store.delete(k)
  store.set(k, v)
  return v
}

export function memoSet(
  schoolId: string,
  from: Lang,
  to: Lang,
  src: string,
  translated: string
): void {
  if (src.length > MAX_LEN) return
  const k = keyOf(schoolId, from, to, src)
  if (store.has(k)) store.delete(k)
  store.set(k, translated)
  if (store.size > MAX_ENTRIES) {
    const oldest = store.keys().next().value
    if (oldest !== undefined) store.delete(oldest)
  }
}

/** Test-only: reset the cache so assertions about DB hits are deterministic. */
export function memoClear(): void {
  store.clear()
}

/** Observability: current entry count. */
export function memoSize(): number {
  return store.size
}
