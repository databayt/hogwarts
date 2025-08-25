import { NextRequest } from "next/server"
import { getWeeklyTimetable } from "@/components/platform/timetable/actions"
import { db } from "@/lib/db"
import { createErrorResponse } from "@/lib/auth-security"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    let termId = searchParams.get("termId")
    const weekOffset = (searchParams.get("weekOffset") ?? "0") as "0" | "1"
    const classId = searchParams.get("classId")
    const teacherId = searchParams.get("teacherId")

    if (!termId) {
      // Public fallback by domain when tenant context is not available
      const domain = searchParams.get('domain') || searchParams.get('school') || undefined
      if (domain) {
        // Use proper Prisma client without unsafe type casting
        const school = await db.school.findFirst({ 
          where: { domain }, 
          select: { id: true } 
        })
        
        if (school) {
          const term = await db.term.findFirst({ 
            where: { schoolId: school.id }, 
            orderBy: { startDate: 'desc' }, 
            select: { id: true } 
          })
          termId = term?.id ?? null
        }
      }
      if (!termId) {
        return new Response(JSON.stringify({ error: "Missing termId" }), { status: 400 })
      }
    }

    const data = await getWeeklyTimetable({
      termId,
      weekOffset: (weekOffset === "1" ? 1 : 0) as 0 | 1,
      view: { classId: classId ?? undefined, teacherId: teacherId ?? undefined },
    })

    return new Response(JSON.stringify(data), { status: 200, headers: { "content-type": "application/json" } })
  } catch (error) {
    console.error("Error fetching timetable:", error)
    return createErrorResponse(error)
  }
}


