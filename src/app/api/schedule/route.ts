import { NextRequest } from "next/server"
import { getScheduleConfig } from "@/components/platform/timetable/actions"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const termId = searchParams.get("termId")
  if (!termId) {
    return new Response(JSON.stringify({ error: "Missing termId" }), { status: 400 })
  }
  const data = await getScheduleConfig({ termId })
  return new Response(JSON.stringify(data), { status: 200, headers: { "content-type": "application/json" } })
}


