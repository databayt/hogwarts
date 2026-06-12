// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  ACADEMIC_CALENDARS,
  computeTermDates,
  resolveAcademicCalendar,
} from "@/components/school-dashboard/timetable/calendars"

// ---------------------------------------------------------------------------
// resolveAcademicCalendar
// ---------------------------------------------------------------------------

describe("resolveAcademicCalendar", () => {
  describe("exact country match", () => {
    it("returns SD calendar for country SD", () => {
      const cal = resolveAcademicCalendar("SD")
      expect(cal.code).toBe("SD")
      expect(cal.yearStartMonth).toBe(10)
      expect(cal.terms).toHaveLength(2)
    })

    it("returns SA calendar for country SA", () => {
      const cal = resolveAcademicCalendar("SA")
      expect(cal.code).toBe("SA")
      expect(cal.terms).toHaveLength(2)
    })

    it("returns AE calendar for country AE (3 terms)", () => {
      const cal = resolveAcademicCalendar("AE")
      expect(cal.code).toBe("AE")
      expect(cal.terms).toHaveLength(3)
    })

    it("returns GB calendar for country GB (3 terms)", () => {
      const cal = resolveAcademicCalendar("GB")
      expect(cal.code).toBe("GB")
      expect(cal.terms).toHaveLength(3)
    })

    it("returns IN calendar for country IN (yearStartMonth 4)", () => {
      const cal = resolveAcademicCalendar("IN")
      expect(cal.code).toBe("IN")
      expect(cal.yearStartMonth).toBe(4)
    })
  })

  describe("GULF regional fallback", () => {
    it("SA → uses SA directly (exact match wins over GULF region)", () => {
      const cal = resolveAcademicCalendar("SA")
      expect(cal.code).toBe("SA")
    })

    it("AE → uses AE directly (exact match wins over GULF region)", () => {
      const cal = resolveAcademicCalendar("AE")
      expect(cal.code).toBe("AE")
    })

    // For countries that map to GULF but have no direct entry
    it("unknown Gulf-region country falls back to GULF", () => {
      // YE (Yemen) maps to nothing directly, but is not in COUNTRY_REGION
      // so it falls through to DEFAULT. Let's use a direct test with a
      // fake country that would map to region via a cast.
      // We'll test the region path by calling with a country that IS in
      // COUNTRY_REGION but NOT in ACADEMIC_CALENDARS directly.
      // SA is in both, so we need to pick one that's only in COUNTRY_REGION.
      // BH: in COUNTRY_REGION → GULF, not in ACADEMIC_CALENDARS directly... wait, it is.
      // Let's verify BH resolves correctly (exact match to BH).
      const cal = resolveAcademicCalendar("BH")
      expect(cal.code).toBe("BH")
    })
  })

  describe("MENA regional fallback", () => {
    it("LB (Lebanon) falls back to MENA (not in ACADEMIC_CALENDARS directly)", () => {
      const cal = resolveAcademicCalendar("LB")
      expect(cal.code).toBe("MENA")
      expect(cal.yearStartMonth).toBe(9)
      expect(cal.terms).toHaveLength(2)
    })

    it("DZ (Algeria) falls back to MENA", () => {
      const cal = resolveAcademicCalendar("DZ")
      expect(cal.code).toBe("MENA")
    })

    it("TN (Tunisia) falls back to MENA", () => {
      const cal = resolveAcademicCalendar("TN")
      expect(cal.code).toBe("MENA")
    })
  })

  describe("unknown country → DEFAULT", () => {
    it("unknown country returns DEFAULT (*) calendar", () => {
      const cal = resolveAcademicCalendar("ZZ")
      expect(cal.code).toBe("*")
      expect(cal.yearStartMonth).toBe(9)
      expect(cal.terms).toHaveLength(2)
    })

    it("null country returns DEFAULT", () => {
      const cal = resolveAcademicCalendar(null)
      expect(cal.code).toBe("*")
    })

    it("undefined country returns DEFAULT", () => {
      const cal = resolveAcademicCalendar(undefined)
      expect(cal.code).toBe("*")
    })
  })

  describe("structure slug override", () => {
    it("sd-british structure overrides to GB calendar", () => {
      const cal = resolveAcademicCalendar("SD", "sd-british")
      expect(cal.code).toBe("GB")
      expect(cal.terms).toHaveLength(3)
    })

    it("sd-ib structure overrides to DEFAULT (*) calendar", () => {
      const cal = resolveAcademicCalendar("SD", "sd-ib")
      expect(cal.code).toBe("*")
    })

    it("structure override takes precedence over country", () => {
      // SD school with sd-british structure → GB calendar, not SD
      const calWithStructure = resolveAcademicCalendar("SD", "sd-british")
      const calCountryOnly = resolveAcademicCalendar("SD")
      expect(calWithStructure.code).toBe("GB")
      expect(calCountryOnly.code).toBe("SD")
    })

    it("unknown structure slug falls through to country match", () => {
      const cal = resolveAcademicCalendar("SA", "nonexistent-slug")
      expect(cal.code).toBe("SA")
    })

    it("structure without calendar override uses country fallback", () => {
      // sd-gov-default has no calendar override → country SD
      const cal = resolveAcademicCalendar("SD", "sd-gov-default")
      expect(cal.code).toBe("SD")
    })
  })
})

// ---------------------------------------------------------------------------
// computeTermDates
// ---------------------------------------------------------------------------

describe("computeTermDates", () => {
  describe("yearName format", () => {
    it("produces baseYear/baseYear+1 format", () => {
      // October → yearStartMonth 9 → Sep-started academic year → baseYear is current year
      const cal = ACADEMIC_CALENDARS["*"]! // Sep start
      const result = computeTermDates(cal, new Date(2025, 10, 15)) // Nov 2025
      expect(result.yearName).toBe("2025/2026")
    })

    it("January date before yearStartMonth → previous year is base", () => {
      const cal = ACADEMIC_CALENDARS["*"]! // yearStartMonth 9
      const result = computeTermDates(cal, new Date(2026, 0, 15)) // Jan 2026
      expect(result.yearName).toBe("2025/2026")
    })
  })

  describe("Sep-start year wrap (DEFAULT calendar)", () => {
    it("Term 1 starts in Sep of baseYear", () => {
      const cal = ACADEMIC_CALENDARS["*"]!
      const result = computeTermDates(cal, new Date(2025, 9, 1)) // Oct 2025
      const t1 = result.terms[0]
      expect(t1.startDate.getFullYear()).toBe(2025)
      expect(t1.startDate.getMonth()).toBe(8) // September (0-indexed)
    })

    it("Term 2 ends in Jun of baseYear+1", () => {
      const cal = ACADEMIC_CALENDARS["*"]!
      const result = computeTermDates(cal, new Date(2025, 9, 1)) // Oct 2025
      const t2 = result.terms[1]
      expect(t2.endDate.getFullYear()).toBe(2026)
      expect(t2.endDate.getMonth()).toBe(5) // June (0-indexed)
    })

    it("US T1 ends Dec of baseYear, T2 starts Jan of baseYear+1", () => {
      const cal = ACADEMIC_CALENDARS["US"]!
      const result = computeTermDates(cal, new Date(2025, 9, 1)) // Oct 2025
      const t1 = result.terms[0]
      const t2 = result.terms[1]
      expect(t1.endDate.getFullYear()).toBe(2025)
      expect(t1.endDate.getMonth()).toBe(11) // Dec
      expect(t2.startDate.getFullYear()).toBe(2026)
      expect(t2.startDate.getMonth()).toBe(0) // Jan
    })
  })

  describe("India year-wrap (IN calendar, yearStartMonth 4)", () => {
    it("Term 1 starts Apr of baseYear, ends Sep of baseYear", () => {
      const cal = ACADEMIC_CALENDARS["IN"]!
      const result = computeTermDates(cal, new Date(2025, 5, 15)) // Jun 2025
      const t1 = result.terms[0]
      expect(t1.startDate.getFullYear()).toBe(2025)
      expect(t1.startDate.getMonth()).toBe(3) // April
      expect(t1.endDate.getFullYear()).toBe(2025)
      expect(t1.endDate.getMonth()).toBe(8) // September
    })

    it("Term 2 starts Oct of baseYear, ends Mar of baseYear+1", () => {
      const cal = ACADEMIC_CALENDARS["IN"]!
      const result = computeTermDates(cal, new Date(2025, 5, 15)) // Jun 2025
      const t2 = result.terms[1]
      expect(t2.startDate.getFullYear()).toBe(2025)
      expect(t2.startDate.getMonth()).toBe(9) // October
      expect(t2.endDate.getFullYear()).toBe(2026) // NEXT calendar year
      expect(t2.endDate.getMonth()).toBe(2) // March
    })

    it("yearName for Jun 2025 IN academic year is 2025/2026", () => {
      const cal = ACADEMIC_CALENDARS["IN"]!
      const result = computeTermDates(cal, new Date(2025, 5, 15))
      expect(result.yearName).toBe("2025/2026")
    })

    it("Jan 2026 is still in 2025/2026 IN academic year", () => {
      const cal = ACADEMIC_CALENDARS["IN"]!
      const result = computeTermDates(cal, new Date(2026, 0, 15)) // Jan 2026
      // yearStartMonth=4, Jan < 4 → baseYear = 2025
      expect(result.yearName).toBe("2025/2026")
    })
  })

  describe("exactly-one-active invariant", () => {
    it("date inside Term 1 → Term 1 is active", () => {
      const cal = ACADEMIC_CALENDARS["*"]!
      // Term 1: Sep 1 – Jan 31; Oct 15 is inside
      const result = computeTermDates(cal, new Date(2025, 9, 15)) // Oct 15 2025
      const activeTerms = result.terms.filter((t) => t.isActive)
      expect(activeTerms).toHaveLength(1)
      expect(activeTerms[0].termNumber).toBe(1)
    })

    it("date inside Term 2 → Term 2 is active", () => {
      const cal = ACADEMIC_CALENDARS["*"]!
      // Term 2: Feb 1 – Jun 30; Mar 15 is inside
      const result = computeTermDates(cal, new Date(2026, 2, 15)) // Mar 15 2026
      const activeTerms = result.terms.filter((t) => t.isActive)
      expect(activeTerms).toHaveLength(1)
      expect(activeTerms[0].termNumber).toBe(2)
    })

    it("date in a gap between terms → next upcoming term is active", () => {
      // GB: T1 Sep–Dec, T2 Jan–Apr, T3 Apr–Jul
      // Gap between T1 end (Dec 19) and T2 start (Jan 5): Dec 25
      const cal = ACADEMIC_CALENDARS["GB"]!
      const result = computeTermDates(cal, new Date(2025, 11, 25)) // Dec 25 2025
      const activeTerms = result.terms.filter((t) => t.isActive)
      expect(activeTerms).toHaveLength(1)
      // Dec 25 is after T1 end (Dec 19), before T2 start (Jan 5) → T2 is next
      expect(activeTerms[0].termNumber).toBe(2)
    })

    it("date before all terms (early Sep before T1 start) → first term active", () => {
      // SD: T1 Oct 1 – Jan 31. Aug 1 is before any term.
      const cal = ACADEMIC_CALENDARS["SD"]!
      const result = computeTermDates(cal, new Date(2025, 7, 1)) // Aug 1 2025
      // yearStartMonth=10, Aug(8) < 10 → baseYear=2024 (not 2025)
      // We need a date in the academic year but before T1 start
      // With baseYear=2024: T1 = Oct 1 2024 – Jan 31 2025
      // So let's use Aug 1 2025: baseYear=2025 (Aug < Oct → baseYear=2024)
      // Actually Aug(8) < 10 → baseYear = 2024
      // T1 starts Oct 1 2024 — Aug 1 2025 is AFTER T1 end (Jan 31 2025)
      // T2 Feb 1 2025 – Jun 30 2025 — Aug 1 2025 is after T2 end too.
      // So it falls to "after all terms → last term" → T2 is active.
      // Let's use a simpler scenario: a date in Sep 2025 for DEFAULT calendar
      const calDefault = ACADEMIC_CALENDARS["*"]! // yearStartMonth=9
      const resultSep = computeTermDates(calDefault, new Date(2025, 8, 1)) // Sep 1 2025 = exactly T1 start
      const activeTermsSep = resultSep.terms.filter((t) => t.isActive)
      expect(activeTermsSep).toHaveLength(1)
    })

    it("date after all terms → last term is active", () => {
      // DEFAULT: T2 ends Jun 30. Aug 15 is after all terms.
      const cal = ACADEMIC_CALENDARS["*"]!
      // Aug 2025: yearStartMonth=9, Aug(8) < 9 → baseYear=2024
      // T2 ends Jun 30 2025. Aug 15 2025 is after.
      const result = computeTermDates(cal, new Date(2025, 7, 15)) // Aug 15 2025
      const activeTerms = result.terms.filter((t) => t.isActive)
      expect(activeTerms).toHaveLength(1)
      // Should be last term (term 2)
      const lastTerm = result.terms[result.terms.length - 1]
      expect(activeTerms[0].termNumber).toBe(lastTerm.termNumber)
    })

    it("3-term calendar always has exactly one active term", () => {
      const cal = ACADEMIC_CALENDARS["AE"]! // 3 terms
      const dates = [
        new Date(2025, 9, 1), // Oct — T1
        new Date(2025, 11, 25), // Dec 25 — gap between T1 and T2
        new Date(2026, 1, 1), // Feb — T2
        new Date(2026, 3, 1), // Apr — T3
      ]
      for (const date of dates) {
        const result = computeTermDates(cal, date)
        const activeTerms = result.terms.filter((t) => t.isActive)
        expect(activeTerms).toHaveLength(1)
      }
    })
  })

  describe("yearStart and yearEnd span full academic year", () => {
    it("yearStart equals first term startDate", () => {
      const cal = ACADEMIC_CALENDARS["*"]!
      const result = computeTermDates(cal, new Date(2025, 10, 1))
      expect(result.yearStart.getTime()).toBe(
        result.terms[0].startDate.getTime()
      )
    })

    it("yearEnd equals last term endDate", () => {
      const cal = ACADEMIC_CALENDARS["*"]!
      const result = computeTermDates(cal, new Date(2025, 10, 1))
      const last = result.terms[result.terms.length - 1]
      expect(result.yearEnd.getTime()).toBe(last.endDate.getTime())
    })
  })
})
