/**
 * Announcement Title Lookup API
 *
 * Returns title for a specific announcement ID.
 *
 * USE CASES:
 * - Display announcement title from ID reference
 * - Breadcrumb navigation display
 *
 * MULTI-TENANT SAFETY:
 * - schoolId from tenant context
 * - Announcement must belong to user's school
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
      "announcements"
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

    const announcement = await db.announcement.findFirst({
      where: {
        id: (await params).id,
        schoolId,
      },
      select: {
        titleEn: true,
        titleAr: true,
      },
    })

    if (!announcement) {
      return NextResponse.json(
        { error: "Announcement not found" },
        { status: 404 }
      )
    }

    // Prefer Arabic title if available, otherwise use English
    const name = announcement.titleAr || announcement.titleEn || "Announcement"

    return NextResponse.json({ name })
  } catch (error) {
    console.error("Error fetching announcement:", error)
    return createErrorResponse(error)
  }
}
