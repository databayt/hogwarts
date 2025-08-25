import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { getTenantContext } from "@/components/operator/lib/tenant"
import { createErrorResponse } from "@/lib/auth-security"
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting for API endpoints
    const rateLimitResponse = await rateLimit(request, RATE_LIMITS.API, 'classrooms');
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return new Response(JSON.stringify({ classrooms: [] }), { status: 200 })
    }

    // Use proper Prisma client without unsafe type casting
    const classrooms = await db.classroom.findMany({ 
      where: { schoolId }, 
      select: { id: true, roomName: true } 
    })

    return new Response(
      JSON.stringify({ classrooms }), 
      { status: 200, headers: { "content-type": "application/json" } }
    )
  } catch (error) {
    console.error("Error fetching classrooms:", error)
    return createErrorResponse(error)
  }
}


