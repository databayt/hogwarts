import { NextResponse } from "next/server"

import { processPendingEmailNotifications } from "@/components/platform/notifications/email-service"

/**
 * Cron job to process pending notification emails
 *
 * Schedule: Every 5 minutes (cron: 0/5 * * * *)
 * Configure in vercel.json crons array
 */
export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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
