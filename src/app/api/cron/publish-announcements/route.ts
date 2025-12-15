/**
 * Cron Job: Auto-Publish Scheduled Announcements
 *
 * Processes announcements scheduled for publication across ALL schools.
 *
 * TRIGGER OPTIONS:
 * - Vercel Cron: Configure in vercel.json with schedule (e.g., every 5 min)
 * - External service: Uptime Robot, Cronitor, or AWS EventBridge
 * - Manual: POST /api/cron/publish-announcements with Bearer token
 *
 * EXECUTION FLOW:
 * 1. Verify CRON_SECRET (prevents unauthorized triggers)
 * 2. Find all unpublished announcements where scheduledFor <= now
 * 3. Batch update to published=true in single query
 * 4. Invalidate cache for affected schools
 * 5. Return execution report with timing
 *
 * WHY BEARER TOKEN AUTH:
 * - Vercel Cron injects CRON_SECRET as Authorization header
 * - Prevents external abuse (public URL but protected endpoint)
 * - Must be configured in environment variables
 *
 * WHY BATCH UPDATE:
 * - Single DB query instead of N updates (performance)
 * - Atomic operation (all or nothing)
 * - Avoids rate limiting on high-volume schools
 *
 * CACHE INVALIDATION:
 * - Uses revalidateTag() to bust Next.js cache per school
 * - Tag format: "announcements-{schoolId}"
 * - Ensures fresh data after publish
 *
 * GOTCHAS:
 * - No user auth (cron runs without session)
 * - Cross-school operation (not tenant-scoped)
 * - Time comparison uses server timezone (UTC in production)
 * - GET and POST both work (GET for Vercel Cron, POST for manual)
 *
 * @see https://vercel.com/docs/cron-jobs
 */

import { revalidateTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error("[publish-announcements] CRON_SECRET not configured")
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

    // Find all announcements scheduled for publishing
    const scheduledAnnouncements = await db.announcement.findMany({
      where: {
        published: false,
        scheduledFor: {
          lte: now,
        },
      },
      select: {
        id: true,
        schoolId: true,
        titleEn: true,
        titleAr: true,
        scheduledFor: true,
      },
    })

    if (scheduledAnnouncements.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No announcements to publish",
        published: 0,
        duration: Date.now() - startTime,
      })
    }

    // Publish all scheduled announcements
    const result = await db.announcement.updateMany({
      where: {
        id: {
          in: scheduledAnnouncements.map((a) => a.id),
        },
        published: false,
        scheduledFor: {
          lte: now,
        },
      },
      data: {
        published: true,
        publishedAt: now,
      },
    })

    // Invalidate cache for all affected schools
    const affectedSchools = new Set(
      scheduledAnnouncements.map((a) => a.schoolId)
    )
    affectedSchools.forEach((schoolId) => {
      revalidateTag(`announcements-${schoolId}`, "max")
    })

    // Log successful publishes
    console.log(
      `[publish-announcements] Published ${result.count} announcements:`,
      scheduledAnnouncements.map((a) => ({
        id: a.id,
        title: a.titleEn || a.titleAr,
        scheduledFor: a.scheduledFor,
      }))
    )

    return NextResponse.json({
      success: true,
      message: `Published ${result.count} announcements`,
      published: result.count,
      announcements: scheduledAnnouncements.map((a) => ({
        id: a.id,
        title: a.titleEn || a.titleAr,
        scheduledFor: a.scheduledFor,
      })),
      duration: Date.now() - startTime,
    })
  } catch (error) {
    console.error("[publish-announcements] Error:", error)

    return NextResponse.json(
      {
        error: "Failed to publish scheduled announcements",
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
