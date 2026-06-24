// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/** Context every resolver needs: the tenant and the display language. */
export interface ResolverCtx {
  schoolId: string
  lang: "ar" | "en"
}

/** Format a date for merge output in the school's language. */
export function formatDate(
  date: Date | null | undefined,
  lang: "ar" | "en"
): string {
  if (!date) return ""
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

/** Map a QuestionBank `options` JSON blob into labelled A/B/C choices for a paper. */
export function toLabelledOptions(
  options: unknown
): Array<{ label: string; text: string }> {
  if (!Array.isArray(options)) return []
  return options.map((o, i) => {
    const text =
      o && typeof o === "object" && "text" in o
        ? String((o as { text: unknown }).text ?? "")
        : String(o ?? "")
    return { label: String.fromCharCode(65 + i), text }
  })
}
