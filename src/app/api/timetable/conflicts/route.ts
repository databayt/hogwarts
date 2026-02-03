/**
 * Timetable Conflicts Detection API
 *
 * Checks for schedule conflicts (double-booked teachers, rooms, etc.)
 *
 * USE CASES:
 * - Real-time validation during timetable editing
 * - Pre-commit check before saving schedule changes
 * - Admin audit to find existing scheduling problems
 *
 * CONFLICT TYPES DETECTED:
 * - Teacher double-booking: Same teacher, same period, different classes
 * - Room conflicts: Same room, same period, different classes
 * - Student conflicts: Same student enrolled in classes that overlap
 *
 * WHY force-dynamic:
 * - Conflicts change as schedule is edited
 * - Must return fresh data on every request
 * - Cannot be cached or statically generated
 *
 * PARAMETERS:
 * - termId (optional): Filter conflicts to specific term
 *   If omitted, checks current active term
 *
 * NOTE: This endpoint delegates to detectTimetableConflicts() action
 * which performs O(n²) comparison. Consider caching results for
 * read-heavy scenarios.
 */

import { NextRequest } from "next/server"

import { detectTimetableConflicts } from "@/components/school-dashboard/timetable/actions"

// WHY: Timetable conflicts change frequently during editing
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const termId = searchParams.get("termId") || undefined
  const data = await detectTimetableConflicts({ termId })
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "content-type": "application/json" },
  })
}
