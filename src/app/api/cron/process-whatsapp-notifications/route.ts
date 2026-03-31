import { NextResponse } from "next/server"

import { processWhatsAppNotifications } from "@/lib/whatsapp/dispatch"

/**
 * Cron job to process pending WhatsApp notifications
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

    const result = await processWhatsAppNotifications()

    console.log(
      `[Cron] WhatsApp: ${result.processed} processed, ${result.sent} sent, ${result.failed} failed`
    )

    return NextResponse.json({
      success: true,
      ...result,
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
