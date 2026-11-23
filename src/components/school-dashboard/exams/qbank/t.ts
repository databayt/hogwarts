// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The question bank's dictionary subtree (`dictionary.exams.qbank`).
 *
 * The `exams` namespace is not merged into the Dictionary type yet, so it is
 * read loosely. Works in server and client components alike: pass the full
 * dictionary (or the result of `useDictionaryFallback()`). A missing key reads
 * as undefined — callers fall back to `""`, never to English.
 */
// One shared object, so a missing subtree keeps a stable identity for memo deps.
const EMPTY: Record<string, any> = Object.freeze({})

export function qbankT(dict: unknown): Record<string, any> {
  return ((dict as any)?.exams?.qbank ?? EMPTY) as Record<string, any>
}

/** Fill `{name}` placeholders: fmt(t.pointsValue, { count: 3 }). */
export function fmt(
  template: string | undefined,
  values: Record<string, string | number>
): string {
  let out = template ?? ""
  for (const [k, v] of Object.entries(values)) {
    out = out.replaceAll(`{${k}}`, String(v))
  }
  return out
}
