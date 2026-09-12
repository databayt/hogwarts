"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"
import { z } from "zod"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

/**
 * Web Push subscriptions — the browser channel of the notification system.
 *
 * The client subscribes with the VAPID public key (NEXT_PUBLIC_VAPID_PUBLIC_KEY,
 * inlined at build) on a user gesture and hands the W3C subscription here.
 * One row per device/browser, tenant-scoped; the cron processor in
 * src/lib/notifications/push-web.ts sends to every row of the recipient.
 */

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(2048),
  keys: z.object({
    p256dh: z.string().min(1).max(512),
    auth: z.string().min(1).max(256),
  }),
  userAgent: z.string().max(512).optional(),
})

type Result = { success: true } | { success: false; error: string }

async function requireUser(): Promise<
  { userId: string; schoolId: string } | { error: string }
> {
  const [session, { schoolId }] = await Promise.all([auth(), getTenantContext()])
  if (!session?.user?.id) return { error: "Unauthorized" }
  if (!schoolId) return { error: "Missing school" }
  return { userId: session.user.id, schoolId }
}

export async function subscribeWebPush(input: unknown): Promise<Result> {
  const ctx = await requireUser()
  if ("error" in ctx) return { success: false, error: ctx.error }
  const parsed = subscriptionSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: "Invalid subscription" }

  const { endpoint, keys, userAgent } = parsed.data
  // The endpoint is unique per browser; re-subscribing from the same browser
  // (or after a sign-out and back in) just refreshes the row and its owner.
  await db.pushSubscription.upsert({
    where: { endpoint },
    create: {
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userAgent: userAgent ?? null,
      userId: ctx.userId,
      schoolId: ctx.schoolId,
    },
    update: {
      p256dh: keys.p256dh,
      auth: keys.auth,
      userAgent: userAgent ?? null,
      userId: ctx.userId,
      schoolId: ctx.schoolId,
      lastSeenAt: new Date(),
      failedAt: null,
    },
  })
  return { success: true }
}

export async function unsubscribeWebPush(input: unknown): Promise<Result> {
  const ctx = await requireUser()
  if ("error" in ctx) return { success: false, error: ctx.error }
  const parsed = z.object({ endpoint: z.string().url().max(2048) }).safeParse(input)
  if (!parsed.success) return { success: false, error: "Invalid subscription" }

  // Only the owner may remove a subscription; a stranger's endpoint is a no-op.
  await db.pushSubscription.deleteMany({
    where: { endpoint: parsed.data.endpoint, userId: ctx.userId },
  })
  return { success: true }
}

/** Whether this browser's subscription is known to the server (for the toggle). */
export async function isWebPushSubscribed(input: unknown): Promise<boolean> {
  const ctx = await requireUser()
  if ("error" in ctx) return false
  const parsed = z.object({ endpoint: z.string().url().max(2048) }).safeParse(input)
  if (!parsed.success) return false
  const row = await db.pushSubscription.findFirst({
    where: { endpoint: parsed.data.endpoint, userId: ctx.userId },
    select: { id: true },
  })
  return Boolean(row)
}
