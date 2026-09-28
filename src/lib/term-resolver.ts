import { cache } from "react"

import { db } from "@/lib/db"
import {
  computeTermDates,
  resolveAcademicCalendar,
} from "@/components/school-dashboard/timetable/calendars"

/**
 * Shared 3-priority term resolution.
 * Used by both timetable and attendance modules.
 *
 * Priority:
 * 1. Explicitly marked as active (isActive: true)
 * 2. Current date falls within term dates
 * 3. Most recent term by start date
 */
/**
 * Deduped per server render — the teacher dashboard alone resolved the term
 * six times in one render. cache() is a passthrough inside Server Actions and
 * route handlers, which is where terms are written (timetable, catalog
 * provisioning), so an action never reads a term memoized before its write.
 */
export const resolveActiveTerm = cache(resolveActiveTermUncached)

async function resolveActiveTermUncached(schoolId: string): Promise<{
  term: {
    id: string
    termNumber: number
    startDate: Date
    endDate: Date
    yearId: string
  } | null
  source: "explicit" | "date_range" | "most_recent" | "none"
}> {
  const today = new Date()

  // One query for all three read priorities. They used to be up to four
  // sequential Term.findFirst calls (~90 ms each from the app to Neon), and
  // this runs on the dashboard, timetable, attendance and live paths. A
  // school holds a handful of terms, so pick in memory with the same rules.
  const terms = await db.term.findMany({
    where: { schoolId },
    orderBy: { startDate: "desc" },
    select: {
      id: true,
      termNumber: true,
      startDate: true,
      endDate: true,
      isActive: true,
      schoolYear: { select: { id: true } },
    },
  })

  const picked = pickActiveTerm(terms, today)
  if (picked) {
    const { term, source } = picked
    return {
      term: {
        id: term.id,
        termNumber: term.termNumber,
        startDate: term.startDate,
        endDate: term.endDate,
        yearId: term.schoolYear.id,
      },
      source,
    }
  }

  // Priority 4: Auto-provision a default year, full term set, periods, and week
  // config when none exist. Uses country-aware calendar logic so the term dates
  // are correct for the school's region.
  if (terms.length === 0) {
    try {
      const schoolRecord = await db.school.findUnique({
        where: { id: schoolId },
        select: { country: true },
      })

      const now = new Date()
      const calendar = resolveAcademicCalendar(schoolRecord?.country)
      const computed = computeTermDates(calendar, now)

      // Create or reuse school year
      let schoolYear = await db.schoolYear.findFirst({
        where: { schoolId, yearName: computed.yearName },
      })
      if (!schoolYear) {
        schoolYear = await db.schoolYear.create({
          data: {
            schoolId,
            yearName: computed.yearName,
            startDate: computed.yearStart,
            endDate: computed.yearEnd,
          },
        })
      }

      // Create all terms for the calendar, capturing the active one
      let activeTerm: (typeof computed.terms)[0] | undefined
      for (const termDef of computed.terms) {
        await db.term.create({
          data: {
            schoolId,
            yearId: schoolYear.id,
            termNumber: termDef.termNumber,
            startDate: termDef.startDate,
            endDate: termDef.endDate,
            isActive: termDef.isActive,
          },
        })
        if (termDef.isActive) activeTerm = termDef
      }

      // activeTerm is always defined (computeTermDates guarantees exactly one active)
      if (!activeTerm) activeTerm = computed.terms[0]

      // Create default periods (Period 1 to 7 + Break)
      const defaultPeriods = [
        { name: "Period 1", startTime: "08:00", endTime: "08:45" },
        { name: "Period 2", startTime: "08:50", endTime: "09:35" },
        { name: "Period 3", startTime: "09:40", endTime: "10:25" },
        { name: "Break", startTime: "10:25", endTime: "10:45" },
        { name: "Period 4", startTime: "10:45", endTime: "11:30" },
        { name: "Period 5", startTime: "11:35", endTime: "12:20" },
        { name: "Period 6", startTime: "12:25", endTime: "13:10" },
        { name: "Period 7", startTime: "13:15", endTime: "14:00" },
      ]

      for (const p of defaultPeriods) {
        const [startHour, startMin] = p.startTime.split(":").map(Number)
        const [endHour, endMin] = p.endTime.split(":").map(Number)

        await db.period.create({
          data: {
            schoolId,
            yearId: schoolYear.id,
            name: p.name,
            startTime: new Date(Date.UTC(1970, 0, 1, startHour, startMin)),
            endTime: new Date(Date.UTC(1970, 0, 1, endHour, endMin)),
          },
        })
      }

      // Lookup the active term id from the DB (we just created it)
      const activeTermRecord = await db.term.findFirst({
        where: { schoolId, yearId: schoolYear.id, isActive: true },
        select: { id: true, termNumber: true, startDate: true, endDate: true },
      })

      if (activeTermRecord) {
        // Create default school week config
        await db.schoolWeekConfig.create({
          data: {
            schoolId,
            termId: activeTermRecord.id,
            workingDays: [0, 1, 2, 3, 4], // Sun-Thu
            defaultLunchAfterPeriod: 3,
          },
        })

        return {
          term: {
            id: activeTermRecord.id,
            termNumber: activeTermRecord.termNumber,
            startDate: activeTermRecord.startDate,
            endDate: activeTermRecord.endDate,
            yearId: schoolYear.id,
          },
          source: "explicit" as const,
        }
      }
    } catch (e) {
      console.error("[resolveActiveTerm] Auto-provision failed:", e)
    }
  }

  return { term: null, source: "none" }
}

type TermRow = {
  startDate: Date
  endDate: Date
  isActive: boolean
}

/**
 * The resolver's read priorities, applied to a school's terms sorted by
 * start date, newest first:
 * 1. an active term whose dates contain today, else any active term
 *    (legacy data can flag more than one term active);
 * 2. a term whose dates contain today;
 * 3. the most recent term.
 */
export function pickActiveTerm<T extends TermRow>(
  terms: readonly T[],
  today: Date
): { term: T; source: "explicit" | "date_range" | "most_recent" } | null {
  const containsToday = (t: T) => t.startDate <= today && t.endDate >= today
  const active =
    terms.find((t) => t.isActive && containsToday(t)) ??
    terms.find((t) => t.isActive)
  if (active) return { term: active, source: "explicit" }
  const current = terms.find(containsToday)
  if (current) return { term: current, source: "date_range" }
  if (terms[0]) return { term: terms[0], source: "most_recent" }
  return null
}
