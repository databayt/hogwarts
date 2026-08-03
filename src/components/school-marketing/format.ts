// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Format a number in the locale's own digits.
 *
 * Plain `toLocaleString("ar")` returns Latin digits -- current CLDR gives bare
 * `ar` the `latn` numbering system, so 94 stays "94". The Arabic dictionary
 * writes its figures in Arabic-Indic (٦٢, ١٥:١), so a computed number rendered
 * beside them has to ask for `nu-arab` explicitly, or the two sit side by side
 * in different scripts.
 *
 * Kept out of `utils.ts`, which imports `next/headers` and so cannot be
 * reached from a client component.
 */
export function formatNumber(value: number, locale: string): string {
  return value.toLocaleString(locale === "ar" ? "ar-u-nu-arab" : locale)
}
