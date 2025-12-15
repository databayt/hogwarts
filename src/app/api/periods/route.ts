/**
 * School Periods API
 *
 * Returns class periods (time slots) for a specific term.
 *
 * USE CASES:
 * - Timetable: Available slots for scheduling
 * - Attendance: Which period to record
 * - Reports: Filter by period
 *
 * PARAMETERS:
 * - termId (required): Academic term context
 *
 * DATA MODEL:
 * - Period belongs to AcademicYear (via yearId)
 * - Term references AcademicYear
 * - Query: termId → term.yearId → periods
 *
 * WHY TERM-BASED LOOKUP:
 * - Different years may have different period structures
 * - (e.g., Year 2024: 8 periods, Year 2025: 7 periods)
 * - Term provides the year context
 *
 * MULTI-TENANT SAFETY:
 * - schoolId from tenant context
 * - Periods scoped to school + year
 *
 * RESPONSE FORMAT:
 * - periods: Array of { id, name } ordered by startTime
 *
 * WHY force-dynamic:
 * - Periods may change during year setup
 *
 * GRACEFUL DEGRADATION:
 * - No schoolId → empty periods (not error)
 * - Invalid termId → empty periods
 */

import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { getTenantContext } from "@/components/operator/lib/tenant"
import { createErrorResponse } from "@/lib/auth-security"

// WHY: Period definitions change during setup
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return new Response(JSON.stringify({ periods: [] }), { status: 200 })
    }

    const { searchParams } = new URL(req.url)
    const termId = searchParams.get("termId")
    if (!termId) {
      return new Response(JSON.stringify({ error: "Missing termId" }), { status: 400 })
    }

    // Use proper Prisma client without unsafe type casting
    const term = await db.term.findFirst({ 
      where: { id: termId, schoolId }, 
      select: { yearId: true } 
    })

    if (!term) {
      return new Response(JSON.stringify({ periods: [] }), { status: 200 })
    }

    const periods = await db.period.findMany({
      where: { schoolId, yearId: term.yearId },
      orderBy: { startTime: 'asc' },
      select: { id: true, name: true },
    })

    return new Response(
      JSON.stringify({ periods }), 
      { status: 200, headers: { "content-type": "application/json" } }
    )
  } catch (error) {
    console.error("Error fetching periods:", error)
    return createErrorResponse(error)
  }
}


