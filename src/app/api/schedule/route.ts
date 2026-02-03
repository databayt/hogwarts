/**
 * Schedule Configuration API
 *
 * Returns school schedule settings (week structure, periods, etc.)
 *
 * USE CASES:
 * - Timetable editor: Know available days/periods
 * - Public timetable: Display grid structure
 * - Reports: Understand schedule constraints
 *
 * PARAMETERS:
 * - termId (required): Academic term context
 *
 * RESPONSE INCLUDES:
 * - weekDays: Which days school operates (Sun-Thu vs Mon-Fri)
 * - periods: Time slots with start/end times
 * - breakPeriods: Which slots are breaks (non-schedulable)
 *
 * WHY TERM-BASED:
 * - Schedule may vary by term (exam period, Ramadan, etc.)
 * - Different academic years may have different structures
 *
 * WHY force-dynamic:
 * - Schedule config changes during setup
 *
 * @see /components/school-dashboard/timetable/actions.ts
 */

import { NextRequest } from "next/server"

import { getScheduleConfig } from "@/components/school-dashboard/timetable/actions"

// WHY: Schedule config changes during setup
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const termId = searchParams.get("termId")
  if (!termId) {
    return new Response(JSON.stringify({ error: "Missing termId" }), {
      status: 400,
    })
  }
  const data = await getScheduleConfig({ termId })
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "content-type": "application/json" },
  })
}
