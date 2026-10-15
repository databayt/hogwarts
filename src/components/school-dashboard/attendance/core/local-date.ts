// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The calendar day the user is living in, as "YYYY-MM-DD".
 *
 * Never `new Date().toISOString().slice(0, 10)`: that is the UTC day, so for a
 * school east of UTC every mark made between local midnight and the offset
 * (00:00–02:00 Khartoum, 00:00–03:00 Riyadh) landed on the previous day. The
 * day string is sent as-is and stored at midnight UTC of that date.
 */
export function localCalendarDay(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/** Midnight UTC of a "YYYY-MM-DD" day — the instant attendance rows use. */
export function calendarDayToStoredISO(day: string): string {
  return `${day}T00:00:00.000Z`
}
