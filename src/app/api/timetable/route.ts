/**
 * Weekly Timetable API
 *
 * Returns the timetable grid for a specific week and view.
 *
 * PARAMETERS:
 * - termId (required unless domain provided): Academic term
 * - weekOffset: 0 = current week, 1 = next week
 * - classId (optional): Filter by class
 * - teacherId (optional): Filter by teacher
 * - domain (optional): School subdomain for public access
 *
 * VIEW MODES:
 * - No filters: Full school timetable (admin view)
 * - classId: Specific class schedule (student view)
 * - teacherId: Teacher's teaching schedule
 *
 * PUBLIC ACCESS (domain param):
 * - WHY: Public school pages need timetable without auth
 * - Looks up school by domain, then finds latest term
 * - Limited to read-only data
 *
 * WEEK OFFSET:
 * - 0: Current week (Mon-Fri based on server date)
 * - 1: Next week (for advance planning)
 * - WHY only 0|1: Prevents large date range queries
 *
 * WHY force-dynamic:
 * - Timetable changes during editing
 * - Week offset depends on current date
 * - Must return fresh data
 *
 * RESPONSE FORMAT:
 * 2D grid: days (Mon-Fri) × periods
 * Each cell contains lesson info or null
 *
 * GOTCHAS:
 * - termId takes precedence over domain lookup
 * - Returns 400 if no termId can be determined
 * - Time displayed in school's timezone (not UTC)
 *
 * @see /components/platform/timetable/actions.ts
 */

import { NextRequest } from "next/server"

import { createErrorResponse } from "@/lib/auth-security"
import { db } from "@/lib/db"
import { getWeeklyTimetable } from "@/components/platform/timetable/actions"

// WHY: Timetable must be fresh, week offset depends on current date
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    let termId = searchParams.get("termId")
    const weekOffset = (searchParams.get("weekOffset") ?? "0") as "0" | "1"
    const classId = searchParams.get("classId")
    const teacherId = searchParams.get("teacherId")

    if (!termId) {
      // Public fallback by domain when tenant context is not available
      const domain =
        searchParams.get("domain") || searchParams.get("school") || undefined
      if (domain) {
        // Use proper Prisma client without unsafe type casting
        const school = await db.school.findFirst({
          where: { domain },
          select: { id: true },
        })

        if (school) {
          const term = await db.term.findFirst({
            where: { schoolId: school.id },
            orderBy: { startDate: "desc" },
            select: { id: true },
          })
          termId = term?.id ?? null
        }
      }
      if (!termId) {
        return new Response(JSON.stringify({ error: "Missing termId" }), {
          status: 400,
        })
      }
    }

    const data = await getWeeklyTimetable({
      termId,
      weekOffset: (weekOffset === "1" ? 1 : 0) as 0 | 1,
      view: {
        classId: classId ?? undefined,
        teacherId: teacherId ?? undefined,
      },
    })

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "content-type": "application/json" },
    })
  } catch (error) {
    console.error("Error fetching timetable:", error)
    return createErrorResponse(error)
  }
}
