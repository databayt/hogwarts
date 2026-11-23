// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"

import { processPendingPushNotifications } from "@/lib/notifications/push-fcm"
import { processPendingWebPushes } from "@/lib/notifications/push-web"

export const dynamic = "force-dynamic"

/**
 * Constant-time Bearer-token check (mirror of process-whatsapp cron).
 * `timingSafeEqual` requires equal-length buffers, so length mismatch
 * short-circuits — leaks only that *some* token was provided.
 */
function isAuthorizedCron(request: Request): boolean {
  const expected = process.env.CRON_SECRET
  if (!expected) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[cron/process-push-notifications] CRON_SECRET unset in production — refusing"
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
 * Cron — deliver queued FCM push notifications.
 *
 * Drains Web Push first, then native push through the FCM HTTP v1 API
 * (push-fcm.ts) for each recipient's registered device tokens.
 *
 * FIREBASE_* env unset: the FCM processor returns
 * `{ processed: 0, skippedReason: "not_configured" }` and the cron logs a
 * single warning per tick.
 */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const startedAt = Date.now()

  try {
    // Web Push first, then FCM. FCM keeps its own claim on each row (see
    // push-fcm.ts), so web's pushSent flag does not hide rows from phones.
    const web = await processPendingWebPushes(400)
    if (web.skippedReason === "not_configured") {
      console.warn(
        "[Cron] process-push-notifications: Web Push not configured (set NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT)"
      )
    } else {
      console.log(
        `[Cron] process-push-notifications: web processed=${web.processed} succeeded=${web.succeeded} noDevice=${web.noDevice} failed=${web.failed} pruned=${web.pruned}`
      )
    }

    const result = await processPendingPushNotifications(50)

    if (result.skippedReason === "not_configured") {
      // One log per tick is enough — flag the configuration gap without
      // burying useful logs in noise.
      console.warn(
        "[Cron] process-push-notifications: FCM not configured (set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)"
      )
    } else {
      console.log(
        `[Cron] process-push-notifications: processed=${result.processed} succeeded=${result.succeeded} failed=${result.failed}`
      )
    }

    return NextResponse.json({
      success: true,
      web,
      ...result,
      durationMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[Cron] process-push-notifications failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        durationMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
