/**
 * Classrooms Selection API
 *
 * Returns list of physical rooms for dropdown selection.
 *
 * USE CASES:
 * - Timetable: Assign room to lesson
 * - Events: Book room for meeting
 * - Exams: Allocate exam venues
 *
 * RATE LIMITING:
 * - API tier rate limits applied
 * - WHY: Prevents enumeration attacks on room list
 *
 * MULTI-TENANT SAFETY:
 * - schoolId from tenant context
 * - Can only see own school's rooms
 *
 * RESPONSE FORMAT:
 * - classrooms: Array of { id, roomName }
 *
 * WHY MINIMAL DATA:
 * - Dropdown only needs id and display name
 * - Capacity/features queried separately if needed
 *
 * WHY force-dynamic:
 * - Rooms may be added/removed
 *
 * GRACEFUL DEGRADATION:
 * - No schoolId → empty classrooms (not error)
 */

import { NextRequest } from "next/server"

import { createErrorResponse } from "@/lib/auth-security"
import { db } from "@/lib/db"
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit"
import { getTenantContext } from "@/components/saas-dashboard/lib/tenant"

// WHY: Room list changes
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting for API endpoints
    const rateLimitResponse = await rateLimit(
      request,
      RATE_LIMITS.API,
      "classrooms"
    )
    if (rateLimitResponse) {
      return rateLimitResponse
    }
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return new Response(JSON.stringify({ classrooms: [] }), { status: 200 })
    }

    // Use proper Prisma client without unsafe type casting
    const classrooms = await db.classroom.findMany({
      where: { schoolId },
      select: { id: true, roomName: true },
    })

    return new Response(JSON.stringify({ classrooms }), {
      status: 200,
      headers: { "content-type": "application/json" },
    })
  } catch (error) {
    console.error("Error fetching classrooms:", error)
    return createErrorResponse(error)
  }
}
