import { NextRequest } from "next/server"
import { detectTimetableConflicts } from "@/components/platform/timetable/actions"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const termId = searchParams.get("termId") || undefined
  const data = await detectTimetableConflicts({ termId })
  return new Response(JSON.stringify(data), { status: 200, headers: { "content-type": "application/json" } })
}


