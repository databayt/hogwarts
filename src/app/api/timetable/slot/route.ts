import { NextRequest } from "next/server"
import { upsertTimetableSlot } from "@/components/platform/timetable/actions"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const res = await upsertTimetableSlot(body)
  if (res instanceof Response) return res
  return new Response(JSON.stringify(res), { status: 200, headers: { "content-type": "application/json" } })
}


