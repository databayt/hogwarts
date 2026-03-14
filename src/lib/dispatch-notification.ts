// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type {
  NotificationChannel,
  NotificationPriority,
  NotificationType,
} from "@prisma/client"
import { Prisma } from "@prisma/client"

import { db } from "@/lib/db"

// Default expiration: 30 days
const NOTIFICATION_EXPIRATION_DAYS = 30

/**
 * System-level notification creation (no session required).
 * For use by cron jobs, internal triggers, and cross-module pipelines.
 */
export async function dispatchNotification(params: {
  schoolId: string
  userId: string
  type: NotificationType
  title: string
  body: string
  lang?: string
  priority?: NotificationPriority
  actorId?: string
  channels?: NotificationChannel[]
  metadata?: Record<string, unknown>
}): Promise<string | null> {
  try {
    // Check user preference
    const shouldSend = await shouldSendNotification(
      params.userId,
      params.type,
      "in_app"
    )
    if (!shouldSend) return null

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + NOTIFICATION_EXPIRATION_DAYS)

    const notification = await db.notification.create({
      data: {
        schoolId: params.schoolId,
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        lang: params.lang ?? "ar",
        priority: params.priority ?? "normal",
        actorId: params.actorId ?? null,
        channels: params.channels ?? ["in_app"],
        metadata:
          (params.metadata as unknown as Prisma.InputJsonValue) ?? undefined,
        expiresAt,
      },
    })

    return notification.id
  } catch (error) {
    console.error("[dispatchNotification] Error:", error)
    return null
  }
}

/**
 * Bulk variant for audience targeting.
 * Resolves users based on scope and creates notifications for each.
 */
export async function dispatchNotificationsToAudience(params: {
  schoolId: string
  type: NotificationType
  title: string
  body: string
  lang?: string
  priority?: NotificationPriority
  actorId?: string
  channels?: NotificationChannel[]
  metadata?: Record<string, unknown>
  targetScope: "school" | "class" | "role"
  targetClassId?: string
  targetRole?: string
}): Promise<{ created: number }> {
  try {
    const userIds = await resolveTargetUsers(
      params.schoolId,
      params.targetScope,
      params.targetClassId,
      params.targetRole
    )

    if (userIds.length === 0) return { created: 0 }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + NOTIFICATION_EXPIRATION_DAYS)

    // Filter out users who have disabled this notification type
    const preferences = await db.notificationPreference.findMany({
      where: {
        userId: { in: userIds },
        type: params.type,
        channel: "in_app",
        enabled: false,
      },
      select: { userId: true },
    })
    const disabledUserIds = new Set(preferences.map((p) => p.userId))
    const eligibleUserIds = userIds.filter((id) => !disabledUserIds.has(id))

    if (eligibleUserIds.length === 0) return { created: 0 }

    const result = await db.notification.createMany({
      data: eligibleUserIds.map((userId) => ({
        schoolId: params.schoolId,
        userId,
        type: params.type,
        title: params.title,
        body: params.body,
        lang: params.lang ?? "ar",
        priority: params.priority ?? "normal",
        actorId: params.actorId ?? null,
        channels: params.channels ?? ["in_app"],
        metadata:
          (params.metadata as unknown as Prisma.InputJsonValue) ?? undefined,
        expiresAt,
      })),
      skipDuplicates: true,
    })

    return { created: result.count }
  } catch (error) {
    console.error("[dispatchNotificationsToAudience] Error:", error)
    return { created: 0 }
  }
}

/**
 * Resolve user IDs based on targeting scope
 */
async function resolveTargetUsers(
  schoolId: string,
  scope: "school" | "class" | "role",
  classId?: string,
  role?: string
): Promise<string[]> {
  switch (scope) {
    case "school": {
      const users = await db.user.findMany({
        where: { schoolId },
        select: { id: true },
      })
      return users.map((u) => u.id)
    }
    case "class": {
      if (!classId) return []
      // Get students enrolled in the class + the teacher
      const classData = await db.class.findUnique({
        where: { id: classId },
        select: {
          teacherId: true,
          studentClasses: {
            select: { studentId: true },
          },
        },
      })
      if (!classData) return []
      const ids = classData.studentClasses.map((sc) => sc.studentId)
      if (classData.teacherId) ids.push(classData.teacherId)
      return ids
    }
    case "role": {
      if (!role) return []
      const users = await db.user.findMany({
        where: { schoolId, role: role as any },
        select: { id: true },
      })
      return users.map((u) => u.id)
    }
    default:
      return []
  }
}

/**
 * Check if a notification should be sent based on user preferences
 */
async function shouldSendNotification(
  userId: string,
  type: NotificationType,
  channel: NotificationChannel
): Promise<boolean> {
  const preference = await db.notificationPreference.findUnique({
    where: {
      userId_type_channel: {
        userId,
        type,
        channel,
      },
    },
    select: { enabled: true },
  })
  // Default to enabled if no preference exists
  return preference?.enabled ?? true
}
