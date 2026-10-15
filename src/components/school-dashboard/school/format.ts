// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Locale-aware date/number helpers for the school console.
 *
 * Latin digits in both languages (`numberingSystem: "latn"`), matching the
 * finance formatters; the locale still decides month names and ordering.
 * Safe to import from client and server components.
 */

const bcp47 = (lang: string) => (lang === "ar" ? "ar-SA" : "en-US")

export function formatConsoleDate(
  value: Date | string | number | null | undefined,
  lang: string,
  opts: Intl.DateTimeFormatOptions = { dateStyle: "medium" }
): string {
  if (value === null || value === undefined || value === "") return ""
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return new Intl.DateTimeFormat(bcp47(lang), {
    numberingSystem: "latn",
    calendar: "gregory",
    ...opts,
  }).format(date)
}

export function formatConsoleDateTime(
  value: Date | string | number | null | undefined,
  lang: string
): string {
  return formatConsoleDate(value, lang, {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export function formatConsoleNumber(
  value: number,
  lang: string,
  opts?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(bcp47(lang), {
    numberingSystem: "latn",
    ...opts,
  }).format(value)
}

/** "{count}" style placeholder replacement for dictionary strings. */
export function fill(
  template: string,
  values: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (m, k) =>
    k in values ? String(values[k]) : m
  )
}

/** Look up an enum label, falling back to a humanised raw value. */
export function enumLabel(
  map: Record<string, string> | undefined,
  value: string | null | undefined
): string {
  if (!value) return ""
  return map?.[value] ?? value.replace(/_/g, " ")
}
