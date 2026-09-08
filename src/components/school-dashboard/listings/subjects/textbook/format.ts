// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/** `{name}` placeholders → values; unknown names are left in place. */
export function fill(
  template: string | undefined,
  vars: Record<string, string | number>
): string {
  if (!template) return ""
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    k in vars ? String(vars[k]) : `{${k}}`
  )
}

/** Page counters follow the UI language's numerals (Arabic-Indic for ar),
 *  the same convention the dashboard uses for dates. */
export function formatNumber(n: number, lang: string): string {
  try {
    return new Intl.NumberFormat(lang === "ar" ? "ar-EG" : "en", {
      useGrouping: false,
    }).format(n)
  } catch {
    return String(n)
  }
}

/** Arabic letters that join to the letter after them, so a kashida may follow. */
const JOINS_FORWARD =
  /[\u0628\u062A-\u062C\u062D\u062E\u0633-\u0636\u0637\u0638\u0639\u063A\u0641-\u0643\u0644\u0645\u0646\u0647\u064A\u0626\u0649\u06A9\u06CC\u067E\u0686\u0698\u06AF]/
/** Letters that join to the letter before them — a kashida needs one on its
 *  left too, or it would dangle at the end of a word. */
const JOINS_BACK =
  /[\u0621-\u064A\u0626\u0649\u06A9\u06CC\u067E\u0686\u0698\u06AF]/

/**
 * Stretch an Arabic word the way a printed cover does — with kashida, the
 * elongation stroke, never with letter spacing, which would break the joins.
 * Latin text has no joins and comes back untouched.
 */
export function elongate(text: string, times = 2): string {
  if (times < 1) return text
  const stroke = "\u0640".repeat(times)
  let out = ""
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const next = text[i + 1]
    out += ch
    // Never inside lam-alef: that pair is a single ligature, and a stroke
    // between them reads as a mistake rather than as elongation.
    const lamAlef =
      ch === "\u0644" && /[\u0622\u0623\u0625\u0627]/.test(next ?? "")
    if (next && !lamAlef && JOINS_FORWARD.test(ch) && JOINS_BACK.test(next))
      out += stroke
  }
  return out
}
