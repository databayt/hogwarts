import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { getTenantContext } from "@/components/operator/lib/tenant"
import { createErrorResponse } from "@/lib/auth-security"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return new Response(JSON.stringify({ periods: [] }), { status: 200 })
    }

    const { searchParams } = new URL(req.url)
    const termId = searchParams.get("termId")
    if (!termId) {
      return new Response(JSON.stringify({ error: "Missing termId" }), { status: 400 })
    }

    // Use proper Prisma client without unsafe type casting
    const term = await db.term.findFirst({ 
      where: { id: termId, schoolId }, 
      select: { yearId: true } 
    })

    if (!term) {
      return new Response(JSON.stringify({ periods: [] }), { status: 200 })
    }

    const periods = await db.period.findMany({
      where: { schoolId, yearId: term.yearId },
      orderBy: { startTime: 'asc' },
      select: { id: true, name: true },
    })

    return new Response(
      JSON.stringify({ periods }), 
      { status: 200, headers: { "content-type": "application/json" } }
    )
  } catch (error) {
    console.error("Error fetching periods:", error)
    return createErrorResponse(error)
  }
}


