/**
 * Subject Name Lookup API
 *
 * Returns formatted name for a specific subject ID.
 *
 * USE CASES:
 * - Display subject name from ID reference
 * - Breadcrumb navigation display
 *
 * MULTI-TENANT SAFETY:
 * - schoolId from tenant context
 * - Subject must belong to user's school
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
      "subjects"
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

    const subject = await db.subject.findFirst({
      where: {
        id: (await params).id,
        schoolId,
      },
      select: {
        subjectName: true,
      },
    })

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 })
    }

    const name = subject.subjectName

    return NextResponse.json({ name })
  } catch (error) {
    console.error("Error fetching subject:", error)
    return createErrorResponse(error)
  }
}
