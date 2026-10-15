// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Locale helpers for the attendance reports area (overview, records,
 * activity). Client-safe. Arabic dates are Gregorian with Latin digits —
 * plain `ar-SA` renders the Hijri calendar, which schools here don't use.
 */

export const dateLocale = (lang: string) =>
  lang === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-US"

export function formatDay(
  value: string | Date,
  lang: string,
  opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }
): string {
  return new Intl.DateTimeFormat(dateLocale(lang), opts).format(
    typeof value === "string" ? new Date(value) : value
  )
}

export function formatTime(value: string | Date, lang: string): string {
  return new Intl.DateTimeFormat(dateLocale(lang), {
    hour: "numeric",
    minute: "2-digit",
  }).format(typeof value === "string" ? new Date(value) : value)
}

/** Weekday name for a JS `getDay()` index (0 = Sunday). */
export function weekdayName(
  index: number,
  lang: string,
  width: "long" | "short" = "long"
): string {
  // 2023-01-01 was a Sunday; use noon UTC so no timezone shifts the day.
  const d = new Date(Date.UTC(2023, 0, 1 + index, 12))
  return new Intl.DateTimeFormat(dateLocale(lang), {
    weekday: width,
    timeZone: "UTC",
  }).format(d)
}

/** "3 minutes ago" / "قبل 3 دقائق", localized by the platform. */
export function relativeTime(value: string | Date, lang: string): string {
  const then = typeof value === "string" ? new Date(value) : value
  const seconds = Math.round((then.getTime() - Date.now()) / 1000)
  const rtf = new Intl.RelativeTimeFormat(dateLocale(lang), {
    numeric: "auto",
  })
  const abs = Math.abs(seconds)
  if (abs < 60) return rtf.format(seconds, "second")
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), "minute")
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), "hour")
  return rtf.format(Math.round(seconds / 86400), "day")
}

/** Local calendar-day key (YYYY-MM-DD) for grouping. */
export function dayKey(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${m}-${day}`
}

export function formatPercent(n: number, lang: string): string {
  return `${new Intl.NumberFormat(dateLocale(lang), {
    maximumFractionDigits: 1,
  }).format(n)}%`
}
