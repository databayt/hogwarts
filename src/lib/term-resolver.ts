import { db } from "@/lib/db"

/**
 * Shared 3-priority term resolution.
 * Used by both timetable and attendance modules.
 *
 * Priority:
 * 1. Explicitly marked as active (isActive: true)
 * 2. Current date falls within term dates
 * 3. Most recent term by start date
 */
export async function resolveActiveTerm(schoolId: string): Promise<{
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

  const termSelect = {
    id: true,
    termNumber: true,
    startDate: true,
    endDate: true,
    schoolYear: { select: { id: true } },
  } as const

  // Priority 1: Explicitly marked as active
  const activeTerm = await db.term.findFirst({
    where: { schoolId, isActive: true },
    select: termSelect,
  })

  if (activeTerm) {
    return {
      term: {
        id: activeTerm.id,
        termNumber: activeTerm.termNumber,
        startDate: activeTerm.startDate,
        endDate: activeTerm.endDate,
        yearId: activeTerm.schoolYear.id,
      },
      source: "explicit",
    }
  }

  // Priority 2: Current date falls within term dates
  const currentTerm = await db.term.findFirst({
    where: {
      schoolId,
      startDate: { lte: today },
      endDate: { gte: today },
    },
    select: termSelect,
  })

  if (currentTerm) {
    return {
      term: {
        id: currentTerm.id,
        termNumber: currentTerm.termNumber,
        startDate: currentTerm.startDate,
        endDate: currentTerm.endDate,
        yearId: currentTerm.schoolYear.id,
      },
      source: "date_range",
    }
  }

  // Priority 3: Most recent term
  const recentTerm = await db.term.findFirst({
    where: { schoolId },
    orderBy: { startDate: "desc" },
    select: termSelect,
  })

  if (recentTerm) {
    return {
      term: {
        id: recentTerm.id,
        termNumber: recentTerm.termNumber,
        startDate: recentTerm.startDate,
        endDate: recentTerm.endDate,
        yearId: recentTerm.schoolYear.id,
      },
      source: "most_recent",
    }
  }

  // Priority 4: Auto-provision a default year, term, periods, and week config if none exist
  const termCount = await db.term.count({ where: { schoolId } })
  if (termCount === 0) {
    try {
      const currentYear = new Date().getFullYear()
      const yearName = `${currentYear}/${currentYear + 1}`

      // Create school year
      let schoolYear = await db.schoolYear.findFirst({
        where: { schoolId, yearName },
      })
      if (!schoolYear) {
        schoolYear = await db.schoolYear.create({
          data: {
            schoolId,
            yearName,
            startDate: new Date(`${currentYear}-09-01`),
            endDate: new Date(`${currentYear + 1}-06-30`),
          },
        })
      }

      // Create default active Term 1
      const defaultTerm = await db.term.create({
        data: {
          schoolId,
          yearId: schoolYear.id,
          termNumber: 1,
          startDate: new Date(`${currentYear}-09-01`),
          endDate: new Date(`${currentYear}-12-31`),
          isActive: true,
        },
      })

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

      // Create default school week config
      await db.schoolWeekConfig.create({
        data: {
          schoolId,
          termId: defaultTerm.id,
          workingDays: [0, 1, 2, 3, 4], // Sun-Thu
          defaultLunchAfterPeriod: 3,
        },
      })

      return {
        term: {
          id: defaultTerm.id,
          termNumber: defaultTerm.termNumber,
          startDate: defaultTerm.startDate,
          endDate: defaultTerm.endDate,
          yearId: schoolYear.id,
        },
        source: "explicit",
      }
    } catch (e) {
      console.error("[resolveActiveTerm] Auto-provision failed:", e)
    }
  }

  return { term: null, source: "none" }
}
