/**
 * Cron job to auto-publish scheduled announcements
 *
 * This endpoint should be called periodically (e.g., every 5 minutes) by:
 * - Vercel Cron (configured in vercel.json)
 * - Or external cron service
 *
 * @see https://vercel.com/docs/cron-jobs
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { revalidateTag } from "next/cache";

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[publish-announcements] CRON_SECRET not configured");
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    if (!verifyCronSecret(request)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const now = new Date();
    const startTime = Date.now();

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
        title: true,
        scheduledFor: true,
      },
    });

    if (scheduledAnnouncements.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No announcements to publish",
        published: 0,
        duration: Date.now() - startTime,
      });
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
    });

    // Invalidate cache for all affected schools
    const affectedSchools = new Set(scheduledAnnouncements.map((a) => a.schoolId));
    affectedSchools.forEach((schoolId) => {
      revalidateTag(`announcements-${schoolId}`, "max");
    });

    // Log successful publishes
    console.log(
      `[publish-announcements] Published ${result.count} announcements:`,
      scheduledAnnouncements.map((a) => ({
        id: a.id,
        title: a.title,
        scheduledFor: a.scheduledFor,
      }))
    );

    return NextResponse.json({
      success: true,
      message: `Published ${result.count} announcements`,
      published: result.count,
      announcements: scheduledAnnouncements.map((a) => ({
        id: a.id,
        title: a.title,
        scheduledFor: a.scheduledFor,
      })),
      duration: Date.now() - startTime,
    });
  } catch (error) {
    console.error("[publish-announcements] Error:", error);

    return NextResponse.json(
      {
        error: "Failed to publish scheduled announcements",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
