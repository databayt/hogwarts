// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"

import { processPendingPushNotifications } from "@/lib/notifications/push-fcm"

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
 * Schedule: every 5 minutes (vercel.json). Picks up Notifications with
 * `channels has "push"` and `pushSent: false`, calls firebase-admin per
 * recipient's registered device tokens, marks sent.
 *
 * Scaffold mode (firebase-admin not installed OR FIREBASE_* env unset):
 * the processor returns `{ processed: 0, skippedReason: "not_configured" }`
 * and the cron logs a single warning per tick. No production impact
 * until ops wires up the SDK + credentials.
 */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const startedAt = Date.now()

  try {
    const result = await processPendingPushNotifications(50)

    if (result.skippedReason === "not_configured") {
      // One log per tick is enough — flag the configuration gap without
      // burying useful logs in noise.
      console.warn(
        "[Cron] process-push-notifications: FCM not configured (install firebase-admin + set FIREBASE_* env vars)"
      )
    } else {
      console.log(
        `[Cron] process-push-notifications: processed=${result.processed} succeeded=${result.succeeded} failed=${result.failed}`
      )
    }

    return NextResponse.json({
      success: true,
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
