import { NextRequest } from "next/server"
import { suggestFreeSlots } from "@/components/platform/timetable/actions"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const termId = searchParams.get('termId')
  const teacherId = searchParams.get('teacherId') || undefined
  const classroomId = searchParams.get('classroomId') || undefined
  if (!termId) return new Response(JSON.stringify({ error: 'Missing termId' }), { status: 400 })
  const data = await suggestFreeSlots({ termId, teacherId, classroomId })
  return new Response(JSON.stringify(data), { status: 200, headers: { 'content-type': 'application/json' } })
}


