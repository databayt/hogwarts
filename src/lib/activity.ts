// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import { db } from "@/lib/db"
import type { ClientKind, Platform } from "@/lib/client-info"

/**
 * Per-person "how do they use the platform" record (`user_presence` model,
 * table `user_activity`). One row per user, upserted by `touchActivity`.
 *
 * Wire it where a person demonstrably uses the platform: a class join, a
 * sign-in, the app opening its dashboard. It is throttled — one read, and a
 * write only when the last write is an hour old or something changed — and it
 * NEVER throws, so it is safe to await or fire-and-forget anywhere.
 */

/** A touch within this window with nothing new is not written. */
export const ACTIVITY_THROTTLE_MS = 60 * 60 * 1000

export type TouchInput = {
  userId: string
  schoolId?: string | null
  client?: ClientKind | null
  platform?: Platform | null
  appVersion?: number | null
  /** Test seam. */
  now?: Date
}

export type StoredActivity = {
  lastSeenAt: Date
  lastClient: string | null
  lastPlatform: string | null
  lastAppVersion: number | null
}

/**
 * Pure: should this touch be written? Yes when nothing is stored yet, the stored
 * stamp is >= 60 minutes old, or the client/platform/appVersion differ. A touch
 * that omits a field (null/undefined) never counts as a change in that field.
 */
export function shouldWriteActivity(
  stored: StoredActivity | null,
  next: Pick<TouchInput, "client" | "platform" | "appVersion">,
  now: Date
): boolean {
  if (!stored) return true
  if (now.getTime() - stored.lastSeenAt.getTime() >= ACTIVITY_THROTTLE_MS) {
    return true
  }
  if (next.client && next.client !== stored.lastClient) return true
  if (next.platform && next.platform !== stored.lastPlatform) return true
  if (next.appVersion != null && next.appVersion !== stored.lastAppVersion) {
    return true
  }
  return false
}

export async function touchActivity(input: TouchInput): Promise<void> {
  try {
    const { userId } = input
    if (!userId) return
    const now = input.now ?? new Date()
    const client = input.client ?? null
    const platform = input.platform ?? null
    const appVersion = input.appVersion ?? null

    const stored = await db.userPresence.findUnique({
      where: { userId },
      select: {
        lastSeenAt: true,
        lastClient: true,
        lastPlatform: true,
        lastAppVersion: true,
      },
    })
    if (!shouldWriteActivity(stored, { client, platform, appVersion }, now)) {
      return
    }

    const isApp = client === "app"
    const isAndroidWeb = client === "web" && platform === "android"
    await db.userPresence.upsert({
      where: { userId },
      create: {
        userId,
        schoolId: input.schoolId ?? null,
        lastSeenAt: now,
        lastClient: client,
        lastPlatform: platform,
        lastAppVersion: appVersion,
        lastAppAt: isApp ? now : null,
        lastAndroidWebAt: isAndroidWeb ? now : null,
      },
      update: {
        lastSeenAt: now,
        ...(input.schoolId ? { schoolId: input.schoolId } : {}),
        // A touch with no client info (e.g. a bare sign-in) must not erase what
        // a join already told us.
        ...(client ? { lastClient: client } : {}),
        ...(platform ? { lastPlatform: platform } : {}),
        ...(appVersion != null ? { lastAppVersion: appVersion } : {}),
        ...(isApp ? { lastAppAt: now } : {}),
        ...(isAndroidWeb ? { lastAndroidWebAt: now } : {}),
      },
      select: { id: true },
    })
  } catch (err) {
    console.error("[activity] touch failed", {
      userId: input.userId,
      err: err instanceof Error ? err.message : String(err),
    })
  }
}
