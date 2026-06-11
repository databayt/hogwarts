"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { headers } from "next/headers"
import { auth } from "@/auth"

import { getTenantContext } from "@/lib/tenant-context"
import { localize } from "@/components/translation/localize"
import type { Lang } from "@/components/translation/types"

import { getRecentNotifications, getUnreadNotificationCount } from "./queries"
import type { NotificationDTO } from "./types"

export interface NotificationBellData {
  unreadCount: number
  recent: NotificationDTO[]
}

/**
 * Detect the current display locale from the request URL.
 * Falls back to "ar" if not determinable.
 */
function getDisplayLocale(): Lang {
  try {
    const headersList = headers()
    const pathname =
      (headersList as any).get?.("x-pathname") ||
      (headersList as any).get?.("x-invoke-path") ||
      (headersList as any).get?.("referer") ||
      ""
    // Match /{lang}/ at the start of the path or after the domain
    const match = pathname.match(/\/(?:s\/[^/]+\/)?(en|ar)(?:\/|$)/)
    return (match?.[1] as Lang) ?? "ar"
  } catch {
    return "ar"
  }
}

/**
 * Server action for polling notification data.
 * Used as fallback when Socket.IO is unavailable.
 * Translates notification title/body to the user's display locale.
 *
 * @param locale - The display locale passed from the client. Falls back to
 *   header-based detection when omitted (unreliable for server actions called
 *   from client components).
 */
export async function fetchNotificationBellData(
  locale?: Lang
): Promise<NotificationBellData | null> {
  try {
    const [session, { schoolId }] = await Promise.all([
      auth(),
      getTenantContext(),
    ])
    if (!session?.user?.id || !schoolId) return null

    const [unreadCount, recent] = await Promise.all([
      getUnreadNotificationCount(schoolId, session.user.id),
      getRecentNotifications(schoolId, session.user.id, 5),
    ])

    const displayLocale = locale ?? getDisplayLocale()

    // Translate title+body — ONE batched localize() pass for the whole list
    // (this is the polled bell endpoint; per-row getText would be N×2 lookups)
    const localizedRecent = await localize("Notification", recent, {
      schoolId,
      lang: displayLocale,
    })
    const translatedRecent = localizedRecent.map((n) => {
      return {
        id: n.id,
        schoolId: n.schoolId,
        userId: n.userId,
        type: n.type,
        priority: n.priority,
        title: n.title,
        body: n.body,
        lang: n.lang ?? "ar",
        metadata: n.metadata as Record<string, unknown> | null,
        actorId: n.actorId,
        actor: n.actor
          ? {
              id: n.actor.id,
              username: n.actor.username,
              email: n.actor.email,
              image: n.actor.image,
            }
          : null,
        read: n.read,
        readAt: n.readAt?.toISOString() ?? null,
        channels: n.channels,
        emailSent: n.emailSent,
        emailSentAt: n.emailSentAt?.toISOString() ?? null,
        createdAt: n.createdAt.toISOString(),
        updatedAt: n.updatedAt.toISOString(),
      }
    })

    return {
      unreadCount,
      recent: translatedRecent,
    }
  } catch (error) {
    console.error("[fetchNotificationBellData] Error:", error)
    return null
  }
}
