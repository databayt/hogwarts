// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Web Push sender — the browser channel of the notification queue.
 *
 * Pulls Notifications with `channels has "push"` and `pushSent: false`,
 * sends each to every PushSubscription of its recipient with `web-push`
 * (VAPID), marks the row, and prunes subscriptions the push service reports
 * gone (404/410). Runs from the process-push-notifications cron beside the
 * FCM scaffold (push-fcm.ts), which stays a no-op until a native app exists.
 *
 * Configured when the three VAPID env vars are set:
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY  — also inlined into the client for subscribe()
 *   VAPID_PRIVATE_KEY             — a secret; travels the deploy lane's secrets path
 *   VAPID_SUBJECT                 — mailto: or https: contact for the push service
 *
 * The payload the worker reads (public/service-worker.js `push` handler):
 *   { title, body, url, tag, lang, dir }
 * `url` is absolute on the school's own host so a tap lands on the right
 * tenant and locale; `tag` collapses duplicates of the same notification.
 */

import webpush, { WebPushError } from "web-push"

import { db } from "@/lib/db"
import { resolveActionUrl } from "@/lib/dispatch-notification"

export interface WebPushProcessResult {
  processed: number
  succeeded: number
  failed: number
  /** Subscriptions deleted because the push service said they are gone. */
  pruned: number
  skippedReason?: "not_configured" | null
}

export interface WebPushPayload {
  title: string
  body: string
  url: string
  tag: string
  lang: string
  dir: "rtl" | "ltr"
}

function isConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() &&
      process.env.VAPID_PRIVATE_KEY?.trim() &&
      process.env.VAPID_SUBJECT?.trim()
  )
}

let vapidReady = false
function ensureVapid(): void {
  if (vapidReady) return
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!.trim(),
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!.trim(),
    process.env.VAPID_PRIVATE_KEY!.trim()
  )
  vapidReady = true
}

/** The bytes the worker shows. Pure so it can be unit-tested. */
export function buildPushPayload(input: {
  notificationId: string
  title: string
  body: string
  lang?: string | null
  url: string
}): WebPushPayload {
  const lang = input.lang === "en" ? "en" : "ar"
  return {
    title: input.title,
    body: input.body.length > 240 ? `${input.body.slice(0, 239)}…` : input.body,
    url: input.url,
    tag: `n-${input.notificationId}`,
    lang,
    dir: lang === "ar" ? "rtl" : "ltr",
  }
}

interface PendingRow {
  id: string
  userId: string
  schoolId: string
  title: string
  body: string
  lang: string
  metadata: unknown
}

async function pullPending(limit: number): Promise<PendingRow[]> {
  const rows = await db.notification.findMany({
    where: { pushSent: false, channels: { has: "push" } },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: {
      id: true,
      userId: true,
      schoolId: true,
      title: true,
      body: true,
      lang: true,
      metadata: true,
    },
  })
  return rows
}

/** `metadata.url` is stored relative; absolutify on the school's own host. */
async function deepLinkFor(
  row: PendingRow,
  domainCache: Map<string, string>
): Promise<string> {
  const meta = (row.metadata as Record<string, unknown> | null) ?? null
  const raw = typeof meta?.url === "string" ? meta.url : "/notifications"
  let subdomain = domainCache.get(row.schoolId)
  if (subdomain === undefined) {
    const school = await db.school.findUnique({
      where: { id: row.schoolId },
      select: { domain: true },
    })
    subdomain = school?.domain ?? ""
    domainCache.set(row.schoolId, subdomain)
  }
  return resolveActionUrl(raw, subdomain, null, { locale: row.lang })
}

export async function processPendingWebPushes(
  limit = 50
): Promise<WebPushProcessResult> {
  if (!isConfigured()) {
    return {
      processed: 0,
      succeeded: 0,
      failed: 0,
      pruned: 0,
      skippedReason: "not_configured",
    }
  }
  ensureVapid()

  const pending = await pullPending(limit)
  if (pending.length === 0) {
    return { processed: 0, succeeded: 0, failed: 0, pruned: 0, skippedReason: null }
  }

  const domainCache = new Map<string, string>()
  let succeeded = 0
  let failed = 0
  let pruned = 0

  for (const row of pending) {
    const subs = await db.pushSubscription.findMany({
      where: { userId: row.userId },
      select: { id: true, endpoint: true, p256dh: true, auth: true },
    })

    if (subs.length === 0) {
      // No browser asked for push — mark sent so the queue never spins on it.
      // The in-app bell still shows the notification.
      await db.notification.update({
        where: { id: row.id },
        data: { pushSent: true, pushSentAt: new Date() },
      })
      succeeded++
      continue
    }

    const payload = JSON.stringify(
      buildPushPayload({
        notificationId: row.id,
        title: row.title,
        body: row.body,
        lang: row.lang,
        url: await deepLinkFor(row, domainCache),
      })
    )

    let delivered = 0
    let lastError: string | null = null
    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
          { TTL: 60 * 60 * 24, urgency: "normal" }
        )
        delivered++
        await db.pushSubscription.update({
          where: { id: sub.id },
          data: { lastSeenAt: new Date(), failedAt: null },
        })
      } catch (err) {
        const status = err instanceof WebPushError ? err.statusCode : 0
        if (status === 404 || status === 410) {
          // The browser unsubscribed or the app was uninstalled.
          await db.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
          pruned++
          continue
        }
        lastError = err instanceof Error ? err.message : String(err)
        await db.pushSubscription
          .update({ where: { id: sub.id }, data: { failedAt: new Date() } })
          .catch(() => {})
      }
    }

    if (delivered > 0 || lastError === null) {
      await db.notification.update({
        where: { id: row.id },
        data: { pushSent: true, pushSentAt: new Date(), pushError: null },
      })
      succeeded++
    } else {
      // Every subscription failed for a transient reason: leave the row for
      // the next tick, but record why so it is visible.
      await db.notification.update({
        where: { id: row.id },
        data: { pushError: lastError.slice(0, 1000) },
      })
      failed++
      console.error("[push-web] send failed", { notificationId: row.id, error: lastError })
    }
  }

  return { processed: pending.length, succeeded, failed, pruned, skippedReason: null }
}
