/**
 * Lesson Title Lookup API
 *
 * Returns title for a specific lesson ID.
 *
 * USE CASES:
 * - Display lesson title from ID reference
 * - Breadcrumb navigation display
 *
 * MULTI-TENANT SAFETY:
 * - schoolId from tenant context
 * - Lesson must belong to user's school
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
      "lessons"
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

    const lesson = await db.lesson.findFirst({
      where: {
        id: (await params).id,
        schoolId,
      },
      select: {
        title: true,
      },
    })

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    return NextResponse.json({ name: lesson.title })
  } catch (error) {
    console.error("Error fetching lesson:", error)
    return createErrorResponse(error)
  }
}
