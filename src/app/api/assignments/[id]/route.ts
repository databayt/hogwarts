/**
 * Assignment Title Lookup API
 *
 * Returns title for a specific assignment ID.
 *
 * USE CASES:
 * - Display assignment title from ID reference
 * - Breadcrumb navigation display
 *
 * MULTI-TENANT SAFETY:
 * - schoolId from tenant context
 * - Assignment must belong to user's school
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
      "assignments"
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

    const assignment = await db.assignment.findFirst({
      where: {
        id: (await params).id,
        schoolId,
      },
      select: {
        title: true,
      },
    })

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ name: assignment.title })
  } catch (error) {
    console.error("Error fetching assignment:", error)
    return createErrorResponse(error)
  }
}
