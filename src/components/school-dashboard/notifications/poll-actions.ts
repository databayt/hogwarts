// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import "server-only"

import { headers } from "next/headers"
import { auth } from "@/auth"

import { getTenantContext } from "@/lib/tenant-context"
import { localize } from "@/components/translation/localize"
import type { Lang } from "@/components/translation/types"

import {
  getOperatorRecentNotifications,
  getOperatorUnreadCount,
  getRecentNotifications,
  getUnreadNotificationCount,
} from "./queries"
import type { NotificationDTO } from "./types"

export interface NotificationBellData {
  unreadCount: number
  recent: NotificationDTO[]
}

/**
 * Detect the current display locale from the request URL.
 * Falls back to "ar" if not determinable.
 */
async function getDisplayLocale(): Promise<Lang> {
  try {
    // headers() is async in Next 16 — the previous sync call returned a
    // Promise whose .get is undefined, silently forcing the "ar" fallback
    const headersList = await headers()
    const pathname =
      headersList.get("x-pathname") || headersList.get("referer") || ""
    // Match /{lang}/ at the start of the path or after the domain
    const match = pathname.match(/\/(?:s\/[^/]+\/)?(en|ar)(?:\/|$)/)
    return (match?.[1] as Lang) ?? "ar"
  } catch {
    return "ar"
  }
}

/**
 * Bell polling data, served to clients via GET /api/notifications/bell.
 * Used as fallback when Socket.IO is unavailable.
 * Translates notification title/body to the user's display locale.
 *
 * Deliberately NOT a client-callable server action: auth() rotates the
 * session cookie inside action requests, which makes Next ship a full RSC
 * re-render of the page with every poll response.
 *
 * @param locale - The display locale passed from the client. Falls back to
 *   header-based detection when omitted.
 */
export async function fetchNotificationBellData(
  locale?: Lang
): Promise<NotificationBellData | null> {
  try {
    const [session, { schoolId }] = await Promise.all([
      auth(),
      getTenantContext(),
    ])
    const userId = session?.user?.id
    if (!userId) return null

    // A DEVELOPER on the SaaS dashboard has no tenant context at all — that is
    // what made this endpoint 401 for the only role that can act on a platform
    // notification. Their rows are addressed by userId and carry the
    // REQUESTING school's id, so userId alone is the right scope. Every other
    // tenantless caller still gets null (→ 401), unchanged.
    const isOperator = session?.user?.role === "DEVELOPER" && !schoolId
    if (!schoolId && !isOperator) return null

    const [unreadCount, recent] = schoolId
      ? await Promise.all([
          getUnreadNotificationCount(schoolId, userId),
          getRecentNotifications(schoolId, userId, 5),
        ])
      : await Promise.all([
          getOperatorUnreadCount(userId),
          getOperatorRecentNotifications(userId, 5),
        ])

    const displayLocale = locale ?? (await getDisplayLocale())

    // Translate title+body — ONE batched localize() pass per school (this is
    // the polled bell endpoint; per-row getText would be N×2 lookups).
    // An operator's five rows can span several schools while localize() takes
    // exactly one schoolId, so group first and re-merge in the original order.
    const bySchool = new Map<string, typeof recent>()
    for (const row of recent) {
      const group = bySchool.get(row.schoolId)
      if (group) group.push(row)
      else bySchool.set(row.schoolId, [row])
    }
    const localizedGroups = await Promise.all(
      Array.from(bySchool.entries()).map(([sid, rows]) =>
        localize("Notification", rows, { schoolId: sid, lang: displayLocale })
      )
    )
    const localizedById = new Map(
      localizedGroups.flat().map((row) => [row.id, row])
    )
    const localizedRecent = recent.map(
      (row) => localizedById.get(row.id) ?? row
    )
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
