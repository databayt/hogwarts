/**
 * Cron job to auto-unpublish expired announcements
 *
 * This endpoint should be called periodically (e.g., every hour) by:
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
    console.error("[expire-announcements] CRON_SECRET not configured");
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
        expiresAt: true,
      },
    });

    if (expiredAnnouncements.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No announcements to expire",
        expired: 0,
        duration: Date.now() - startTime,
      });
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
    });

    // Invalidate cache for all affected schools
    const affectedSchools = new Set(expiredAnnouncements.map((a) => a.schoolId));
    affectedSchools.forEach((schoolId) => {
      revalidateTag(`announcements-${schoolId}`);
    });

    // Log successful expiration
    console.log(
      `[expire-announcements] Expired ${result.count} announcements:`,
      expiredAnnouncements.map((a) => ({
        id: a.id,
        title: a.title,
        expiresAt: a.expiresAt,
      }))
    );

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
    });
  } catch (error) {
    console.error("[expire-announcements] Error:", error);

    return NextResponse.json(
      {
        error: "Failed to expire announcements",
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
