// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { getStructureBySlug } from "./structures"

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface TermDefinition {
  termNumber: number
  startMonth: number // 1-12
  startDay: number
  endMonth: number
  endDay: number
}

export interface AcademicCalendar {
  code: string
  yearStartMonth: number // month the academic year begins (handles year wrap)
  terms: TermDefinition[]
}

// ---------------------------------------------------------------------------
// Calendar registry
// ---------------------------------------------------------------------------

export const ACADEMIC_CALENDARS: Record<string, AcademicCalendar> = {
  // Sudan: 2 terms, academic year starts October
  SD: {
    code: "SD",
    yearStartMonth: 10,
    terms: [
      { termNumber: 1, startMonth: 10, startDay: 1, endMonth: 1, endDay: 31 },
      { termNumber: 2, startMonth: 2, startDay: 1, endMonth: 6, endDay: 30 },
    ],
  },

  // Saudi Arabia: 2 terms (KSA reverted to 2 semesters AY 1447/2025-26)
  SA: {
    code: "SA",
    yearStartMonth: 8,
    terms: [
      { termNumber: 1, startMonth: 8, startDay: 24, endMonth: 1, endDay: 8 },
      { termNumber: 2, startMonth: 1, startDay: 18, endMonth: 6, endDay: 25 },
    ],
  },

  // UAE: 3 terms
  AE: {
    code: "AE",
    yearStartMonth: 8,
    terms: [
      { termNumber: 1, startMonth: 8, startDay: 25, endMonth: 12, endDay: 7 },
      { termNumber: 2, startMonth: 1, startDay: 5, endMonth: 3, endDay: 15 },
      { termNumber: 3, startMonth: 3, startDay: 30, endMonth: 7, endDay: 3 },
    ],
  },

  // Qatar: 2 terms
  QA: {
    code: "QA",
    yearStartMonth: 8,
    terms: [
      { termNumber: 1, startMonth: 8, startDay: 31, endMonth: 12, endDay: 27 },
      { termNumber: 2, startMonth: 1, startDay: 12, endMonth: 6, endDay: 30 },
    ],
  },

  // Kuwait: 3 terms
  KW: {
    code: "KW",
    yearStartMonth: 9,
    terms: [
      { termNumber: 1, startMonth: 9, startDay: 7, endMonth: 12, endDay: 16 },
      { termNumber: 2, startMonth: 1, startDay: 5, endMonth: 4, endDay: 2 },
      { termNumber: 3, startMonth: 4, startDay: 12, endMonth: 6, endDay: 16 },
    ],
  },

  // Bahrain: 2 terms
  BH: {
    code: "BH",
    yearStartMonth: 9,
    terms: [
      { termNumber: 1, startMonth: 9, startDay: 3, endMonth: 1, endDay: 12 },
      { termNumber: 2, startMonth: 2, startDay: 1, endMonth: 5, endDay: 25 },
    ],
  },

  // Oman: 2 terms
  OM: {
    code: "OM",
    yearStartMonth: 8,
    terms: [
      { termNumber: 1, startMonth: 8, startDay: 27, endMonth: 1, endDay: 14 },
      { termNumber: 2, startMonth: 1, startDay: 15, endMonth: 6, endDay: 23 },
    ],
  },

  // Egypt: 2 terms
  EG: {
    code: "EG",
    yearStartMonth: 9,
    terms: [
      { termNumber: 1, startMonth: 9, startDay: 20, endMonth: 1, endDay: 22 },
      { termNumber: 2, startMonth: 2, startDay: 7, endMonth: 6, endDay: 11 },
    ],
  },

  // Jordan: 2 terms
  JO: {
    code: "JO",
    yearStartMonth: 8,
    terms: [
      { termNumber: 1, startMonth: 8, startDay: 24, endMonth: 1, endDay: 24 },
      { termNumber: 2, startMonth: 1, startDay: 25, endMonth: 6, endDay: 15 },
    ],
  },

  // Morocco: 2 terms
  MA: {
    code: "MA",
    yearStartMonth: 9,
    terms: [
      { termNumber: 1, startMonth: 9, startDay: 8, endMonth: 1, endDay: 30 },
      { termNumber: 2, startMonth: 2, startDay: 2, endMonth: 6, endDay: 30 },
    ],
  },

  // USA: 2 terms
  US: {
    code: "US",
    yearStartMonth: 8,
    terms: [
      { termNumber: 1, startMonth: 8, startDay: 25, endMonth: 12, endDay: 19 },
      { termNumber: 2, startMonth: 1, startDay: 5, endMonth: 6, endDay: 12 },
    ],
  },

  // UK: 3 terms
  GB: {
    code: "GB",
    yearStartMonth: 9,
    terms: [
      { termNumber: 1, startMonth: 9, startDay: 1, endMonth: 12, endDay: 19 },
      { termNumber: 2, startMonth: 1, startDay: 5, endMonth: 4, endDay: 9 },
      { termNumber: 3, startMonth: 4, startDay: 14, endMonth: 7, endDay: 22 },
    ],
  },

  // India: 2 terms, year-wrapping (T2 ends in next calendar year)
  IN: {
    code: "IN",
    yearStartMonth: 4,
    terms: [
      { termNumber: 1, startMonth: 4, startDay: 1, endMonth: 9, endDay: 30 },
      { termNumber: 2, startMonth: 10, startDay: 1, endMonth: 3, endDay: 31 },
    ],
  },

  // GULF region fallback (SA, AE, QA, KW, BH, OM)
  GULF: {
    code: "GULF",
    yearStartMonth: 9,
    terms: [
      { termNumber: 1, startMonth: 9, startDay: 1, endMonth: 1, endDay: 15 },
      { termNumber: 2, startMonth: 2, startDay: 1, endMonth: 6, endDay: 20 },
    ],
  },

  // MENA region fallback (EG, JO, LB, TN, MA, DZ)
  MENA: {
    code: "MENA",
    yearStartMonth: 9,
    terms: [
      { termNumber: 1, startMonth: 9, startDay: 1, endMonth: 1, endDay: 31 },
      { termNumber: 2, startMonth: 2, startDay: 1, endMonth: 6, endDay: 15 },
    ],
  },

  // DEFAULT — byte-compatible with the current hardcoded Sep 1 – Jun 30 behavior
  "*": {
    code: "*",
    yearStartMonth: 9,
    terms: [
      { termNumber: 1, startMonth: 9, startDay: 1, endMonth: 1, endDay: 31 },
      { termNumber: 2, startMonth: 2, startDay: 1, endMonth: 6, endDay: 30 },
    ],
  },
}

// ---------------------------------------------------------------------------
// Country → region mapping (mirrors COUNTRY_REGION in structures.ts)
// ---------------------------------------------------------------------------

const COUNTRY_REGION: Record<string, string> = {
  SA: "GULF",
  AE: "GULF",
  QA: "GULF",
  KW: "GULF",
  BH: "GULF",
  OM: "GULF",
  EG: "MENA",
  JO: "MENA",
  LB: "MENA",
  TN: "MENA",
  MA: "MENA",
  DZ: "MENA",
}

// ---------------------------------------------------------------------------
// resolveAcademicCalendar
// ---------------------------------------------------------------------------

/**
 * Resolve the academic calendar to use for a school.
 *
 * Priority:
 * 1. If `structureSlug` is given and the structure has a `calendar` override
 *    field, use ACADEMIC_CALENDARS[that code].
 * 2. Exact country match in ACADEMIC_CALENDARS.
 * 3. Regional fallback (same mapping as structures.ts COUNTRY_REGION).
 * 4. DEFAULT ("*").
 */
export function resolveAcademicCalendar(
  country?: string | null,
  structureSlug?: string | null
): AcademicCalendar {
  // Priority 1: structure-level calendar override
  if (structureSlug) {
    const structure = getStructureBySlug(structureSlug)
    if (structure?.calendar) {
      const calendarOverride = ACADEMIC_CALENDARS[structure.calendar]
      if (calendarOverride) return calendarOverride
    }
  }

  // Priority 2: exact country match
  if (country && ACADEMIC_CALENDARS[country]) {
    return ACADEMIC_CALENDARS[country]
  }

  // Priority 3: regional fallback
  if (country) {
    const region = COUNTRY_REGION[country]
    if (region && ACADEMIC_CALENDARS[region]) {
      return ACADEMIC_CALENDARS[region]
    }
  }

  // Priority 4: default
  return ACADEMIC_CALENDARS["*"]
}

// ---------------------------------------------------------------------------
// computeTermDates
// ---------------------------------------------------------------------------

/**
 * Compute concrete Date objects for each term in the calendar relative to `now`.
 *
 * Base year: if current month >= yearStartMonth → use fullYear, else fullYear - 1.
 * A term month belongs to baseYear when month >= yearStartMonth, else baseYear+1
 * (handles IN Apr-Mar and all Sep-Jun wraps).
 *
 * isActive invariant: EXACTLY ONE term is active.
 * - Term containing `now` → active.
 * - If `now` falls in a gap between terms → the next upcoming term.
 * - If before all terms → first term.
 * - If after all terms → last term.
 */
export function computeTermDates(
  calendar: AcademicCalendar,
  now: Date
): {
  yearName: string
  yearStart: Date
  yearEnd: Date
  terms: Array<{
    termNumber: number
    startDate: Date
    endDate: Date
    isActive: boolean
  }>
} {
  const fullYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1 // 1-12

  // Base year: the calendar year in which the academic year STARTS
  const baseYear =
    currentMonth >= calendar.yearStartMonth ? fullYear : fullYear - 1

  // Convert a TermDefinition into a concrete { startDate, endDate }
  const toCalendarYear = (month: number): number =>
    month >= calendar.yearStartMonth ? baseYear : baseYear + 1

  const terms = calendar.terms.map((t) => {
    const startYear = toCalendarYear(t.startMonth)
    const endYear = toCalendarYear(t.endMonth)

    return {
      termNumber: t.termNumber,
      startDate: new Date(startYear, t.startMonth - 1, t.startDay),
      endDate: new Date(endYear, t.endMonth - 1, t.endDay),
    }
  })

  const yearStart = terms[0].startDate
  const yearEnd = terms[terms.length - 1].endDate
  const yearName = `${baseYear}/${baseYear + 1}`

  // Determine which term is active — exactly one must be active
  let activeIndex = -1

  // Check if `now` falls within a term
  for (let i = 0; i < terms.length; i++) {
    if (now >= terms[i].startDate && now <= terms[i].endDate) {
      activeIndex = i
      break
    }
  }

  // If in a gap, find the next upcoming term
  if (activeIndex === -1) {
    for (let i = 0; i < terms.length; i++) {
      if (now < terms[i].startDate) {
        activeIndex = i
        break
      }
    }
  }

  // If before all terms, use first; if after all terms, use last
  if (activeIndex === -1) {
    activeIndex = terms.length - 1
  }

  return {
    yearName,
    yearStart,
    yearEnd,
    terms: terms.map((t, i) => ({ ...t, isActive: i === activeIndex })),
  }
}
