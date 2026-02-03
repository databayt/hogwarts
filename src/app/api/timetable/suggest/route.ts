/**
 * Timetable Free Slot Suggestion API
 *
 * Finds available time slots for scheduling new lessons.
 *
 * USE CASES:
 * - Schedule new lesson: "When is Mr. Ahmed free?"
 * - Room booking: "Which rooms are available 3rd period?"
 * - Conflict avoidance: Pre-check before manual scheduling
 *
 * PARAMETERS:
 * - termId (required): Academic term to check
 * - teacherId (optional): Filter for specific teacher availability
 * - classroomId (optional): Filter for specific room availability
 *
 * ALGORITHM:
 * 1. Get all defined periods for the term
 * 2. Get all existing timetable entries
 * 3. Subtract occupied from total → free slots
 * 4. Filter by teacher/room if specified
 *
 * WHY force-dynamic:
 * - Timetable changes frequently during editing
 * - Stale suggestions cause double-booking
 * - Must query fresh data every time
 *
 * WHY DELEGATE TO ACTION:
 * - Complex query logic belongs in action
 * - Reusable from server components
 * - Keeps route handler thin
 *
 * RESPONSE FORMAT:
 * Array of { dayOfWeek, periodId, startTime, endTime }
 *
 * GOTCHAS:
 * - Returns ALL free slots (may be many)
 * - Consider pagination for large schools
 * - Teacher availability != preference
 *
 * @see /components/school-dashboard/timetable/actions.ts
 */

import { NextRequest } from "next/server"

import { suggestFreeSlots } from "@/components/school-dashboard/timetable/actions"

// WHY: Suggestions change as timetable is edited
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const termId = searchParams.get("termId")
  const teacherId = searchParams.get("teacherId") || undefined
  const classroomId = searchParams.get("classroomId") || undefined
  if (!termId)
    return new Response(JSON.stringify({ error: "Missing termId" }), {
      status: 400,
    })
  const data = await suggestFreeSlots({ termId, teacherId, classroomId })
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "content-type": "application/json" },
  })
}
