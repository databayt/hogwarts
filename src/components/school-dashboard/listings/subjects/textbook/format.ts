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
