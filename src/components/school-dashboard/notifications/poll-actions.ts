"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import { getRecentNotifications, getUnreadNotificationCount } from "./queries"
import type { NotificationDTO } from "./types"

export interface NotificationBellData {
  unreadCount: number
  recent: NotificationDTO[]
}

/**
 * Server action for polling notification data.
 * Used as fallback when Socket.IO is unavailable.
 */
export async function fetchNotificationBellData(): Promise<NotificationBellData | null> {
  try {
    const session = await auth()
    if (!session?.user?.id || !session?.user?.schoolId) return null

    const [unreadCount, recent] = await Promise.all([
      getUnreadNotificationCount(session.user.schoolId, session.user.id),
      getRecentNotifications(session.user.schoolId, session.user.id, 5),
    ])

    return {
      unreadCount,
      recent: recent.map((n) => ({
        id: n.id,
        schoolId: n.schoolId,
        userId: n.userId,
        type: n.type,
        priority: n.priority,
        title: n.title,
        body: n.body,
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
      })),
    }
  } catch (error) {
    console.error("[fetchNotificationBellData] Error:", error)
    return null
  }
}
