import { NextResponse } from "next/server"

import { processWhatsAppNotifications } from "@/lib/whatsapp/dispatch"

/**
 * Cron job to process pending WhatsApp notifications + retry failed message dispatches
 *
 * Schedule: Every 5 minutes (cron: 0/5 * * * *)
 * Configure in vercel.json crons array
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    console.log("[Cron] Processing pending WhatsApp notifications...")

    // Process notification-triggered WhatsApp sends
    const notifResult = await processWhatsAppNotifications()

    console.log(
      `[Cron] WhatsApp notifications: ${notifResult.processed} processed, ${notifResult.sent} sent, ${notifResult.failed} failed`
    )

    // Retry failed messaging-triggered WhatsApp dispatches
    let retryResult = { processed: 0, sent: 0, failed: 0, skipped: 0 }
    try {
      const { retryFailedMessageDispatches } =
        await import("@/components/school-dashboard/messaging/whatsapp-bridge")
      retryResult = await retryFailedMessageDispatches()
      console.log(
        `[Cron] WhatsApp retries: ${retryResult.processed} processed, ${retryResult.sent} sent, ${retryResult.failed} failed, ${retryResult.skipped} skipped`
      )
    } catch (retryError) {
      console.error("[Cron] WhatsApp retry error:", retryError)
    }

    return NextResponse.json({
      success: true,
      notifications: notifResult,
      retries: retryResult,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[Cron] Failed to process WhatsApp notifications:", error)

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
