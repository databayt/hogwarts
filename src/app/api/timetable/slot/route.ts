/**
 * Timetable Slot Upsert API
 *
 * Creates or updates a single timetable entry (lesson assignment).
 *
 * USE CASES:
 * - Drag-and-drop lesson scheduling
 * - Manual slot editing in timetable grid
 * - Bulk import via CSV (calls repeatedly)
 *
 * UPSERT BEHAVIOR:
 * - If slot exists for day/period/class: UPDATE
 * - If slot doesn't exist: CREATE
 * - WHY upsert: Prevents duplicate slot errors
 *
 * SLOT UNIQUENESS:
 * Combination of: termId + dayOfWeek + periodId + classId
 * One class can only have one lesson per period
 *
 * WHY DELEGATE TO ACTION:
 * - Complex validation (teacher conflicts, room conflicts)
 * - Transaction handling for atomic updates
 * - Reusable from drag-drop UI and forms
 *
 * WHY force-dynamic:
 * - Writes to database
 * - Must not be cached
 *
 * REQUEST BODY:
 * - termId, dayOfWeek, periodId, classId: Required
 * - teacherId, subjectId, classroomId: Optional
 * - null values clear existing assignments
 *
 * GOTCHAS:
 * - Returns Response object if action creates error response
 * - Otherwise returns the created/updated slot
 * - No bulk endpoint (call multiple times)
 *
 * @see /components/platform/timetable/actions.ts
 */

import { NextRequest } from "next/server"
import { upsertTimetableSlot } from "@/components/platform/timetable/actions"

// WHY: Write operation, must not be cached
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const res = await upsertTimetableSlot(body)
  if (res instanceof Response) return res
  return new Response(JSON.stringify(res), { status: 200, headers: { "content-type": "application/json" } })
}


