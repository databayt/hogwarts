/**
 * Teachers Selection API
 *
 * Returns simplified teacher list for dropdown/select components.
 *
 * USE CASES:
 * - Timetable: Assign teacher to lesson slot
 * - Subject: Designate subject teacher
 * - Class: Assign homeroom teacher
 *
 * PARAMETERS:
 * - termId (required): Academic term context
 *   WHY: Teacher availability may vary by term
 *
 * RESPONSE FORMAT:
 * Array of { id, name, subjects }
 * Minimal data for dropdown performance
 *
 * WHY SEPARATE FROM /teachers CRUD:
 * - Optimized for select components (minimal fields)
 * - Term-scoped for scheduling relevance
 * - Excludes inactive/on-leave teachers
 *
 * WHY force-dynamic:
 * - Teacher roster changes
 * - Must return current data
 *
 * @see /components/school-dashboard/timetable/actions.ts
 */

import { NextRequest } from "next/server"

import { getTeachersForSelection } from "@/components/school-dashboard/timetable/actions"

// WHY: Teacher availability changes
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const termId = searchParams.get("termId")
  if (!termId)
    return new Response(JSON.stringify({ error: "Missing termId" }), {
      status: 400,
    })
  const data = await getTeachersForSelection({ termId })
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "content-type": "application/json" },
  })
}
