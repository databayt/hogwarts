// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * FCM Push Notification Sender — Phase 4 scaffold.
 *
 * Today this module is a clean no-op when:
 *   - `firebase-admin` is not installed, OR
 *   - FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY
 *     env vars are unset.
 *
 * That keeps the cron and dispatch path live without binding the repo
 * to firebase-admin or the FCM credentials before ops is ready. When
 * ops greenlights push delivery, the integration is a single function
 * swap (see TODO block at the bottom of this file).
 *
 * Tokens are collected today via `api/mobile/notifications/register`
 * into `NotificationSubscription` with `entityType: "fcm_device"`,
 * `entityId: <device-token>`. The processor pulls those, sends, and
 * deletes any that come back invalid.
 *
 * See: project_aldar_parent_portal_grade_block memory entry, Phase 4.
 */

import { db } from "@/lib/db"

interface PendingPush {
  notificationId: string
  userId: string
  title: string
  body: string
  type: string
  metadata: Record<string, unknown> | null
}

export interface PushProcessResult {
  processed: number
  succeeded: number
  failed: number
  skippedReason?: "not_configured" | null
}

/**
 * Whether push delivery is wired up in this environment. Checked once
 * per cron tick so a missing env var produces a single warning rather
 * than per-notification spam.
 */
function isFcmConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  )
}

/**
 * Pull a batch of Notifications that have `channels has "push"` and
 * have not yet been pushed. Mirrors the email queue pattern.
 */
async function pullPendingPushes(limit: number): Promise<PendingPush[]> {
  const rows = await db.notification.findMany({
    where: {
      pushSent: false,
      channels: { has: "push" },
    },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: {
      id: true,
      userId: true,
      title: true,
      body: true,
      type: true,
      metadata: true,
    },
  })

  return rows.map((r) => ({
    notificationId: r.id,
    userId: r.userId,
    title: r.title,
    body: r.body,
    type: String(r.type),
    metadata: (r.metadata as Record<string, unknown> | null) ?? null,
  }))
}

/**
 * Look up FCM device tokens for a user. Tokens land here via the
 * mobile registration endpoint which stores them as
 * `NotificationSubscription(entityType: "fcm_device", entityId: token)`.
 */
async function getFcmTokensForUser(userId: string): Promise<string[]> {
  const subs = await db.notificationSubscription.findMany({
    where: {
      userId,
      entityType: "fcm_device",
      active: true,
    },
    select: { entityId: true },
  })
  return subs.map((s) => s.entityId)
}

/**
 * Process up to `limit` queued push notifications.
 *
 * In the scaffold state (firebase-admin missing or env unset) this
 * returns immediately with `{ processed: 0, skippedReason: "not_configured" }`
 * so the cron's structured log surfaces the gap without aborting.
 */
export async function processPendingPushNotifications(
  limit: number = 50
): Promise<PushProcessResult> {
  if (!isFcmConfigured()) {
    return {
      processed: 0,
      succeeded: 0,
      failed: 0,
      skippedReason: "not_configured",
    }
  }

  const pending = await pullPendingPushes(limit)
  if (pending.length === 0) {
    return { processed: 0, succeeded: 0, failed: 0, skippedReason: null }
  }

  let succeeded = 0
  let failed = 0

  for (const item of pending) {
    const tokens = await getFcmTokensForUser(item.userId)
    if (tokens.length === 0) {
      // No registered device — mark sent so we don't retry forever.
      // The user can still see the in-app notification.
      await markPushSent(item.notificationId)
      succeeded++
      continue
    }

    try {
      await sendPushViaFcm(tokens, {
        title: item.title,
        body: item.body,
        data: {
          notificationId: item.notificationId,
          type: item.type,
          // Surface the deep-link to the mobile app so tap-to-open
          // routes to the right screen. Phase 4 adds this to metadata.
          deep_link:
            (
              item.metadata as Record<string, unknown> | null
            )?.deep_link?.toString() ?? "",
        },
      })
      await markPushSent(item.notificationId)
      succeeded++
    } catch (error) {
      failed++
      console.error("[push-fcm] send failed", {
        notificationId: item.notificationId,
        userId: item.userId,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return {
    processed: pending.length,
    succeeded,
    failed,
    skippedReason: null,
  }
}

async function markPushSent(notificationId: string): Promise<void> {
  await db.notification.update({
    where: { id: notificationId },
    data: { pushSent: true, pushSentAt: new Date() },
  })
}

/**
 * Actual FCM send — the only function that needs to change when ops
 * wires up firebase-admin. Today it throws because the cron guards
 * against calling it when `isFcmConfigured()` returns false, so this
 * branch is dead until configuration lands.
 *
 * Replacement contract (Phase 4b):
 *
 *   import admin from "firebase-admin"
 *   if (!admin.apps.length) {
 *     admin.initializeApp({
 *       credential: admin.credential.cert({
 *         projectId:   process.env.FIREBASE_PROJECT_ID!,
 *         clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
 *         privateKey:  process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
 *       }),
 *     })
 *   }
 *   await admin.messaging().sendEachForMulticast({
 *     tokens, notification: { title, body }, data,
 *   })
 *
 * Invalid-token cleanup (messaging.errorCodes.unregistered →
 * delete NotificationSubscription row) also belongs in the replacement.
 */
async function sendPushViaFcm(
  _tokens: string[],
  _payload: { title: string; body: string; data: Record<string, string> }
): Promise<void> {
  throw new Error(
    "[push-fcm] FCM is configured but the sender is still the scaffold. " +
      "Install firebase-admin and replace sendPushViaFcm — see file header."
  )
}
