// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * ADEK eSIS daily attendance CSV column layout (2025/26 academic year).
 *
 * Authoritative source: ADEK policy circular (received via Aldar compliance team).
 * Refine this list when the official PDF lands. Until then, columns mirror the
 * working format described in the Aldar onboarding memo at
 * https://kun.databayt.org/en/docs/aldar.
 */
export const ADEK_CSV_COLUMNS = [
  "school_code",
  "submission_date",
  "student_id", // ADEK student reference (eSIS)
  "full_name",
  "category", // AUTHORIZED | UNAUTHORIZED | CAUSE_FOR_CONCERN | LATE | PRESENT
  "minutes_late", // 0 if not late
  "notes",
] as const

export type AdekCsvColumn = (typeof ADEK_CSV_COLUMNS)[number]

export type AdekAbsenceCode =
  | "AUTHORIZED"
  | "UNAUTHORIZED"
  | "CAUSE_FOR_CONCERN"
  | "LATE"
  | "PRESENT"
