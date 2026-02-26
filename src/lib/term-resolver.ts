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

  return { term: null, source: "none" }
}
