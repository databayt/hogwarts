/**
 * Parent/Guardian Name Lookup API
 *
 * Returns formatted name for a specific guardian ID.
 *
 * USE CASES:
 * - Display parent name from ID reference
 * - Breadcrumb navigation display
 *
 * MULTI-TENANT SAFETY:
 * - schoolId from tenant context
 * - Guardian must belong to user's school
 */

import { NextRequest, NextResponse } from "next/server"

import { createErrorResponse } from "@/lib/auth-security"
import { db } from "@/lib/db"
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit"
import { getTenantContext } from "@/components/operator/lib/tenant"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitResponse = await rateLimit(
      request,
      RATE_LIMITS.API,
      "parents"
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

    const guardian = await db.guardian.findFirst({
      where: {
        id: (await params).id,
        schoolId,
      },
      select: {
        givenName: true,
        surname: true,
      },
    })

    if (!guardian) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 })
    }

    const name = [guardian.givenName, guardian.surname]
      .filter(Boolean)
      .join(" ")

    return NextResponse.json({ name })
  } catch (error) {
    console.error("Error fetching parent:", error)
    return createErrorResponse(error)
  }
}
