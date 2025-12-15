/**
 * School Week Configuration API
 *
 * Creates or updates school week settings.
 *
 * USE CASES:
 * - Initial setup: Define school operating days
 * - Configuration change: Switch from Sun-Thu to Mon-Fri
 * - Ramadan adjustment: Temporary schedule changes
 *
 * UPSERT BEHAVIOR:
 * - If config exists: UPDATE
 * - If no config: CREATE
 * - WHY upsert: Single endpoint handles both cases
 *
 * REQUEST BODY:
 * - termId: Which term this applies to
 * - weekDays: Array of days (0=Sun, 1=Mon, etc.)
 * - periodsPerDay: Number of teaching periods
 *
 * WHY force-dynamic:
 * - Write operation (must not be cached)
 *
 * @see /components/platform/timetable/actions.ts
 */

import { NextRequest } from "next/server"
import { upsertSchoolWeekConfig } from "@/components/platform/timetable/actions"

// WHY: Write operation
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const res = await upsertSchoolWeekConfig(body)
  if (res instanceof Response) return res
  return new Response(JSON.stringify(res), { status: 200, headers: { "content-type": "application/json" } })
}


