import { timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"

import { processDueNotificationBatches } from "@/components/school-dashboard/notifications/email-service"

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
        "[cron/process-broadcast-batches] CRON_SECRET unset in production — refusing"
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
 * Cron job to process due NotificationBatch rows — scheduled broadcasts whose
 * `scheduledFor` has arrived, plus unscheduled batches whose inline processing
 * died (still `pending` past a grace period). Without this sweep, a broadcast
 * scheduled for the future stayed `pending` forever.
 *
 * Schedule: every 5 minutes — configured in vercel.json crons array.
 */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  try {
    const result = await processDueNotificationBatches()

    if (result.processed > 0) {
      console.log(
        `[Cron] Broadcast batches: ${result.processed} due, ${result.completed} completed, ${result.failed} failed, ${result.notificationsCreated} notifications created`
      )
    }

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[Cron] Failed to process broadcast batches:", error)

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
