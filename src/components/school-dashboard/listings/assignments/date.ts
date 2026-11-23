// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * One date format for every assignments surface (list, cards, detail,
 * submissions). Gregorian always: `ar-SA` defaults to the Hijri calendar
 * («١٤٤٨/٦/١٤ هـ»), which is not how schools here write due dates. Plain
 * module — safe in server and client components.
 */

const BASE: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
}

/** Used when the school row carries no zone (matches the timetable and live pages). */
export const DEFAULT_ASSIGNMENT_TIME_ZONE = "Africa/Khartoum"

export type AssignmentDateStyle = "short" | "long" | "datetime"

export function assignmentDateLocale(locale: string | undefined): string {
  return locale === "ar" ? "ar-EG" : "en-GB"
}

export function formatAssignmentDate(
  date: Date | string | number | null | undefined,
  locale: string | undefined,
  style: AssignmentDateStyle | Intl.DateTimeFormatOptions = "short",
  /** The school's IANA zone — server and browser print the same day. */
  timeZone?: string | null
): string {
  if (date === null || date === undefined || date === "") return ""
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return ""
  const options: Intl.DateTimeFormatOptions =
    style === "short"
      ? BASE
      : style === "long"
        ? { ...BASE, month: "long" }
        : style === "datetime"
          ? { ...BASE, hour: "numeric", minute: "2-digit" }
          : style
  return new Intl.DateTimeFormat(assignmentDateLocale(locale), {
    ...options,
    calendar: "gregory",
    timeZone: timeZone || DEFAULT_ASSIGNMENT_TIME_ZONE,
  }).format(d)
}
