// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Locale helpers for the configuration editors. Client-safe (no db imports).
 * Digits stay Latin in both languages, matching `finance/lib/format-money`.
 */

const bcp47 = (lang: string) => (lang === "ar" ? "ar-SA" : "en-US")

/** Grouped integer with Latin digits: 2,000 / 2٬000 → always "2,000"-style per locale. */
export function formatCount(n: number, lang: string): string {
  return new Intl.NumberFormat(bcp47(lang), {
    numberingSystem: "latn",
    maximumFractionDigits: 0,
  }).format(n)
}

/**
 * Pick a plural form via Intl.PluralRules (Arabic has zero/one/two/few/many/
 * other) and substitute `{n}`. Falls back to `other`, then to the bare number.
 */
export function plural(
  forms: Record<string, string> | undefined,
  n: number,
  lang: string
): string {
  const cat = new Intl.PluralRules(bcp47(lang)).select(n)
  const tpl = forms?.[cat] ?? forms?.other
  const num = formatCount(n, lang)
  return tpl ? tpl.replace("{n}", num) : num
}

/** Join list parts with the language's comma ("، " in Arabic). */
export function joinList(parts: string[], lang: string): string {
  return parts.join(lang === "ar" ? "، " : ", ")
}
