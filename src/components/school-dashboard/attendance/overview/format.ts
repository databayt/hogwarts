// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Date + text helpers for the attendance Today / Records / Excuses pages.
 * Client-safe. Arabic stays Gregorian with Latin digits — a bare `ar-SA`
 * would render the Hijri calendar, and a bare `ar` Eastern-Arabic digits.
 */

export {
  formatCount,
  plural,
} from "@/components/school-dashboard/school/configuration/ui/format"

export function intlLocale(lang: string): string {
  return lang === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-US"
}

/**
 * Format an attendance calendar date. Marks are stored at midnight UTC of
 * the school's calendar day, so read them in UTC — a viewer west of UTC
 * would otherwise see the previous day.
 */
export function formatDay(
  value: string | Date | null | undefined,
  lang: string,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  }
): string {
  if (!value) return ""
  const d = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return ""
  return new Intl.DateTimeFormat(intlLocale(lang), {
    timeZone: "UTC",
    ...options,
  }).format(d)
}

/** Format a real instant (submittedAt, reviewedAt) in the viewer's zone. */
export function formatInstant(
  value: string | Date | null | undefined,
  lang: string,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  }
): string {
  if (!value) return ""
  const d = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return ""
  return new Intl.DateTimeFormat(intlLocale(lang), options).format(d)
}

/** Substitute `{key}` placeholders. */
export function fill(
  template: string | undefined,
  vars: Record<string, string | number>,
  fallback = ""
): string {
  let out = template ?? fallback
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{${k}}`).join(String(v))
  }
  return out
}

/** Calendar-day key ("YYYY-MM-DD") of a stored attendance date. */
export function dayKey(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value
  return d.toISOString().slice(0, 10)
}
