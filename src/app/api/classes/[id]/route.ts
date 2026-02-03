/**
 * Class Name Lookup API
 *
 * Returns formatted name for a specific class ID.
 *
 * USE CASES:
 * - Display class name from ID reference
 * - Breadcrumb navigation display
 *
 * MULTI-TENANT SAFETY:
 * - schoolId from tenant context
 * - Class must belong to user's school
 */

import { NextRequest, NextResponse } from "next/server"

import { createErrorResponse } from "@/lib/auth-security"
import { db } from "@/lib/db"
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit"
import { getTenantContext } from "@/components/saas-dashboard/lib/tenant"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitResponse = await rateLimit(
      request,
      RATE_LIMITS.API,
      "classes"
    )
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return NextResponse.json(
        { error: "School context not found" },
        { status: 404 }
      )
    }

    const classData = await db.class.findFirst({
      where: {
        id: (await params).id,
        schoolId,
      },
      select: {
        name: true,
        nameAr: true,
      },
    })

    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    // Prefer Arabic name if available, otherwise use English
    const name = classData.nameAr || classData.name

    return NextResponse.json({ name })
  } catch (error) {
    console.error("Error fetching class:", error)
    return createErrorResponse(error)
  }
}
