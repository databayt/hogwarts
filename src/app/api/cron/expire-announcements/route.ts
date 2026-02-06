/**
 * Cron Job: Auto-Expire Announcements
 *
 * Unpublishes announcements that have passed their expiration date.
 *
 * TRIGGER OPTIONS:
 * - Vercel Cron: Configure in vercel.json (e.g., "0 * * * *" = hourly)
 * - External: Uptime Robot, Cronitor, AWS EventBridge
 * - Manual: POST with Bearer token
 *
 * EXECUTION FLOW:
 * 1. Verify CRON_SECRET (prevents unauthorized triggers)
 * 2. Find published announcements where expiresAt <= now
 * 3. Batch unpublish (set published=false)
 * 4. Invalidate cache for affected schools
 * 5. Return execution report
 *
 * WHY SEPARATE FROM publish-announcements:
 * - Different trigger frequencies (publish: every 5 min, expire: hourly)
 * - Different query logic (scheduledFor vs expiresAt)
 * - Cleaner separation of concerns
 *
 * WHY NOT SOFT DELETE:
 * - Announcements stay in database (audit trail)
 * - Just unpublished (published=false)
 * - Can be republished or extended
 *
 * CACHE INVALIDATION:
 * - Uses revalidateTag() per affected school
 * - Ensures stale announcements disappear from dashboards
 * - Tag format: "announcements-{schoolId}"
 *
 * CROSS-SCHOOL OPERATION:
 * - Processes ALL schools in single run
 * - No session auth (runs as system)
 * - CRON_SECRET is the only authorization
 *
 * GOTCHAS:
 * - Time comparison uses server timezone (UTC in production)
 * - Batch update is atomic (all or nothing)
 * - No notification sent on expiry (silent operation)
 * - Orphaned expired announcements if cron fails
 *
 * @see https://vercel.com/docs/cron-jobs
 * @see /publish-announcements for the inverse operation
 */

import { revalidateTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error("[expire-announcements] CRON_SECRET not configured")
    return false
  }

  return authHeader === `Bearer ${cronSecret}`
}

export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    if (!verifyCronSecret(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()
    const startTime = Date.now()

    // Find all published announcements that have expired
    const expiredAnnouncements = await db.announcement.findMany({
      where: {
        published: true,
        expiresAt: {
          lte: now,
        },
      },
      select: {
        id: true,
        schoolId: true,
        title: true,
        lang: true,
        expiresAt: true,
      },
    })

    if (expiredAnnouncements.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No announcements to expire",
        expired: 0,
        duration: Date.now() - startTime,
      })
    }

    // Unpublish all expired announcements
    const result = await db.announcement.updateMany({
      where: {
        id: {
          in: expiredAnnouncements.map((a) => a.id),
        },
        published: true,
        expiresAt: {
          lte: now,
        },
      },
      data: {
        published: false,
      },
    })

    // Invalidate cache for all affected schools
    const affectedSchools = new Set(expiredAnnouncements.map((a) => a.schoolId))
    affectedSchools.forEach((schoolId) => {
      revalidateTag(`announcements-${schoolId}`, "max")
    })

    // Log successful expiration
    console.log(
      `[expire-announcements] Expired ${result.count} announcements:`,
      expiredAnnouncements.map((a) => ({
        id: a.id,
        title: a.title,
        expiresAt: a.expiresAt,
      }))
    )

    return NextResponse.json({
      success: true,
      message: `Expired ${result.count} announcements`,
      expired: result.count,
      announcements: expiredAnnouncements.map((a) => ({
        id: a.id,
        title: a.title,
        expiresAt: a.expiresAt,
      })),
      duration: Date.now() - startTime,
    })
  } catch (error) {
    console.error("[expire-announcements] Error:", error)

    return NextResponse.json(
      {
        error: "Failed to expire announcements",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request)
}
