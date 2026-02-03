/**
 * Teacher Name Lookup API
 *
 * Returns formatted name for a specific teacher ID.
 *
 * USE CASES:
 * - Display teacher name from ID reference
 * - Breadcrumb navigation display
 *
 * MULTI-TENANT SAFETY:
 * - schoolId from tenant context
 * - Teacher must belong to user's school
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
      "teachers"
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

    const teacher = await db.teacher.findFirst({
      where: {
        id: (await params).id,
        schoolId,
      },
      select: {
        givenName: true,
        surname: true,
      },
    })

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    const name = [teacher.givenName, teacher.surname].filter(Boolean).join(" ")

    return NextResponse.json({ name })
  } catch (error) {
    console.error("Error fetching teacher:", error)
    return createErrorResponse(error)
  }
}
