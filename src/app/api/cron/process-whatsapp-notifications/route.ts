import { timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"

import { processWhatsAppNotifications } from "@/lib/whatsapp/dispatch"

export const dynamic = "force-dynamic"

/**
 * Constant-time Bearer-token check. `timingSafeEqual` needs equal-length
 * buffers, so length mismatch short-circuits — that leaks only the fact
 * that *some* token was provided, never a per-byte timing signal.
 */
function isAuthorizedCron(request: Request): boolean {
  const expected = process.env.CRON_SECRET
  if (!expected) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[cron/process-whatsapp-notifications] CRON_SECRET unset in production — refusing"
      )
      return false
    }
    return true
  }

  const header = request.headers.get("authorization") ?? ""
  if (!header.startsWith("Bearer ")) return false
  const token = header.slice("Bearer ".length)
  if (token.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(token), Buffer.from(expected))
}

/**
 * Cron job to process pending WhatsApp notifications + retry failed message dispatches
 *
 * Schedule: Every 5 minutes (cron: 0/5 * * * *)
 * Configure in vercel.json crons array
 */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
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
