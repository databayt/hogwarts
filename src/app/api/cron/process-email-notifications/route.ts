// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextResponse } from "next/server"

import { processPendingEmailNotifications } from "@/components/school-dashboard/notifications/email-service"
import { verifyCronSecret } from "@/lib/cron-auth"

/**
 * Cron job to process pending notification emails
 *
 * Schedule: Every 5 minutes (cron: 0/5 * * * *)
 * Configure in vercel.json crons array
 */
export async function GET(request: Request) {
  // Verify cron secret for security (fail-closed when CRON_SECRET is unset)
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    console.log("[Cron] Processing pending notification emails...")

    const result = await processPendingEmailNotifications(undefined, 100)

    console.log(
      `[Cron] Processed ${result.processed} emails: ${result.succeeded} succeeded, ${result.failed} failed`
    )

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[Cron] Failed to process notification emails:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
