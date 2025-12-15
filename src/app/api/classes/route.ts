/**
 * Classes Selection API
 *
 * Returns simplified class list for dropdown/select components.
 *
 * USE CASES:
 * - Timetable: Select class to view/edit schedule
 * - Attendance: Pick class to record attendance
 * - Exams: Assign exam to specific class
 *
 * PARAMETERS:
 * - termId (required): Academic term context
 *   WHY: Classes may have different subjects per term
 *
 * RESPONSE FORMAT:
 * Array of { id, name, yearLevel, section }
 * Minimal data for dropdown performance
 *
 * WHY SEPARATE FROM /classes CRUD:
 * - Optimized for select components (minimal fields)
 * - Term-scoped (current term's classes only)
 * - No auth required for public timetable views
 *
 * WHY force-dynamic:
 * - Classes change during term setup
 * - Must return current data
 *
 * @see /components/platform/timetable/actions.ts
 */

import { NextRequest } from "next/server"
import { getClassesForSelection } from "@/components/platform/timetable/actions"

// WHY: Class list changes during setup
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const termId = searchParams.get("termId")
  if (!termId) return new Response(JSON.stringify({ error: "Missing termId" }), { status: 400 })
  const data = await getClassesForSelection({ termId })
  return new Response(JSON.stringify(data), { status: 200, headers: { "content-type": "application/json" } })
}


