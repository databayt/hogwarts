/**
 * Shared query builders and utilities for notifications
 * Consolidates query logic to eliminate duplication and improve maintainability
 */

import { db } from "@/lib/db"
import { Prisma, NotificationType, NotificationPriority, NotificationChannel } from "@prisma/client"

// ============================================================================
// Types
// ============================================================================

export type NotificationListFilters = {
  type?: string
  priority?: string
  read?: string
  search?: string
  actorId?: string
}

export type PaginationParams = {
  page: number
  perPage: number
}

export type SortParam = {
  id: string
  desc: boolean
}

export type NotificationSortParams = {
  sort?: SortParam[]
}

export type NotificationQueryParams = NotificationListFilters &
  PaginationParams &
  NotificationSortParams

// Select types for different query contexts
export const notificationListSelect = {
  id: true,
  schoolId: true,
  userId: true,
  type: true,
  priority: true,
  title: true,
  body: true,
  read: true,
  readAt: true,
  actorId: true,
  actor: {
    select: {
      id: true,
      username: true,
      email: true,
      image: true,
    },
  },
  metadata: true,
  channels: true,
  emailSent: true,
  emailSentAt: true,
  createdAt: true,
  updatedAt: true,
} as const

export const notificationDetailSelect = {
  id: true,
  schoolId: true,
  userId: true,
  type: true,
  priority: true,
  title: true,
  body: true,
  metadata: true,
  actorId: true,
  actor: {
    select: {
      id: true,
      username: true,
      email: true,
      image: true,
    },
  },
  read: true,
  readAt: true,
  channels: true,
  emailSent: true,
  emailSentAt: true,
  pushSent: true,
  pushSentAt: true,
  smsSent: true,
  smsSentAt: true,
  expiresAt: true,
  createdAt: true,
  updatedAt: true,
} as const

export const notificationPreferenceSelect = {
  id: true,
  schoolId: true,
  userId: true,
  type: true,
  channel: true,
  enabled: true,
  quietHoursStart: true,
  quietHoursEnd: true,
  digestEnabled: true,
  digestFrequency: true,
  createdAt: true,
  updatedAt: true,
} as const

// ============================================================================
// Query Builders
// ============================================================================

/**
 * Build where clause for notification queries
 * @param schoolId - School ID for multi-tenant filtering
 * @param userId - User ID to filter notifications
 * @param filters - Additional filters
 * @returns Prisma where input
 */
export function buildNotificationWhere(
  schoolId: string,
  userId: string,
  filters: NotificationListFilters = {}
): Prisma.NotificationWhereInput {
  const where: Prisma.NotificationWhereInput = {
    schoolId,
    userId,
  }

  // Type filter
  if (filters.type && Object.values(NotificationType).includes(filters.type as NotificationType)) {
    where.type = filters.type as NotificationType
  }

  // Priority filter
  if (filters.priority && Object.values(NotificationPriority).includes(filters.priority as NotificationPriority)) {
    where.priority = filters.priority as NotificationPriority
  }

  // Read status filter
  if (filters.read) {
    where.read = filters.read === "true"
  }

  // Text search (title or body)
  if (filters.search) {
    where.OR = [
      {
        title: {
          contains: filters.search,
          mode: Prisma.QueryMode.insensitive,
        },
      },
      {
        body: {
          contains: filters.search,
          mode: Prisma.QueryMode.insensitive,
        },
      },
    ]
  }

  // Actor filter
  if (filters.actorId) {
    where.actorId = filters.actorId
  }

  return where
}

/**
 * Build order by clause for notification queries
 * @param sortParams - Sort parameters
 * @returns Prisma order by input
 */
export function buildNotificationOrderBy(
  sortParams?: SortParam[]
): Prisma.NotificationOrderByWithRelationInput[] {
  if (sortParams && Array.isArray(sortParams) && sortParams.length > 0) {
    return sortParams.map((s) => ({
      [s.id]: s.desc ? Prisma.SortOrder.desc : Prisma.SortOrder.asc,
    }))
  }

  // Default: unread first, then by created date descending
  return [
    { read: Prisma.SortOrder.asc },
    { createdAt: Prisma.SortOrder.desc },
  ]
}

/**
 * Build pagination params
 * @param page - Page number (1-indexed)
 * @param perPage - Items per page
 * @returns Object with skip and take
 */
export function buildPagination(page: number, perPage: number) {
  return {
    skip: (page - 1) * perPage,
    take: perPage,
  }
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Get notifications list with filtering, sorting, and pagination
 * @param schoolId - School ID for multi-tenant filtering
 * @param userId - User ID to get notifications for
 * @param params - Query parameters
 * @returns Promise with notifications and total count
 */
export async function getNotificationsList(
  schoolId: string,
  userId: string,
  params: Partial<NotificationQueryParams> = {}
) {
  const where = buildNotificationWhere(schoolId, userId, params)
  const orderBy = buildNotificationOrderBy(params.sort)
  const { skip, take } = buildPagination(
    params.page ?? 1,
    params.perPage ?? 20
  )

  // Execute queries in parallel for better performance
  const [rows, count] = await Promise.all([
    db.notification.findMany({
      where,
      orderBy,
      skip,
      take,
      select: notificationListSelect,
    }),
    db.notification.count({ where }),
  ])

  return { rows, count }
}

/**
 * Get a single notification by ID with full details
 * @param schoolId - School ID for multi-tenant filtering
 * @param userId - User ID for ownership check
 * @param notificationId - Notification ID
 * @returns Promise with notification or null
 */
export async function getNotificationDetail(
  schoolId: string,
  userId: string,
  notificationId: string
) {
  return db.notification.findFirst({
    where: {
      id: notificationId,
      schoolId,
      userId,
    },
    select: notificationDetailSelect,
  })
}

/**
 * Get unread notification count for a user
 * @param schoolId - School ID
 * @param userId - User ID
 * @returns Promise with unread count
 */
export async function getUnreadNotificationCount(
  schoolId: string,
  userId: string
) {
  return db.notification.count({
    where: {
      schoolId,
      userId,
      read: false,
    },
  })
}

/**
 * Get notification statistics for a user
 * @param schoolId - School ID
 * @param userId - User ID
 * @returns Promise with statistics
 */
export async function getNotificationStats(schoolId: string, userId: string) {
  const where = {
    schoolId,
    userId,
  }

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [total, unread, today, thisWeek, byType, byPriority] = await Promise.all([
    db.notification.count({ where }),
    db.notification.count({ where: { ...where, read: false } }),
    db.notification.count({ where: { ...where, createdAt: { gte: todayStart } } }),
    db.notification.count({ where: { ...where, createdAt: { gte: weekStart } } }),
    db.notification.groupBy({
      by: ["type"],
      where,
      _count: true,
    }),
    db.notification.groupBy({
      by: ["priority"],
      where,
      _count: true,
    }),
  ])

  return {
    total,
    unread,
    today,
    thisWeek,
    byType: Object.fromEntries(
      byType.map((item) => [item.type, item._count])
    ) as Record<NotificationType, number>,
    byPriority: Object.fromEntries(
      byPriority.map((item) => [item.priority, item._count])
    ) as Record<NotificationPriority, number>,
  }
}

/**
 * Get recent notifications for a user
 * @param schoolId - School ID
 * @param userId - User ID
 * @param limit - Maximum number of notifications to return
 * @returns Promise with recent notifications
 */
export async function getRecentNotifications(
  schoolId: string,
  userId: string,
  limit = 10
) {
  return db.notification.findMany({
    where: {
      schoolId,
      userId,
    },
    orderBy: {
      createdAt: Prisma.SortOrder.desc,
    },
    take: limit,
    select: notificationListSelect,
  })
}

/**
 * Get unread notifications for a user
 * @param schoolId - School ID
 * @param userId - User ID
 * @param limit - Maximum number of notifications to return
 * @returns Promise with unread notifications
 */
export async function getUnreadNotifications(
  schoolId: string,
  userId: string,
  limit = 20
) {
  return db.notification.findMany({
    where: {
      schoolId,
      userId,
      read: false,
    },
    orderBy: [
      { priority: Prisma.SortOrder.desc },
      { createdAt: Prisma.SortOrder.desc },
    ],
    take: limit,
    select: notificationListSelect,
  })
}

/**
 * Get notifications by type for a user
 * @param schoolId - School ID
 * @param userId - User ID
 * @param type - Notification type
 * @param limit - Maximum number of notifications to return
 * @returns Promise with notifications
 */
export async function getNotificationsByType(
  schoolId: string,
  userId: string,
  type: NotificationType,
  limit = 20
) {
  return db.notification.findMany({
    where: {
      schoolId,
      userId,
      type,
    },
    orderBy: {
      createdAt: Prisma.SortOrder.desc,
    },
    take: limit,
    select: notificationListSelect,
  })
}

/**
 * Get expired notifications that should be cleaned up
 * @param schoolId - School ID (optional, for all schools if omitted)
 * @returns Promise with expired notifications
 */
export async function getExpiredNotifications(schoolId?: string) {
  const where: Prisma.NotificationWhereInput = {
    ...(schoolId && { schoolId }),
    expiresAt: {
      lte: new Date(),
    },
  }

  return db.notification.findMany({
    where,
    select: {
      id: true,
      schoolId: true,
      userId: true,
      type: true,
      expiresAt: true,
    },
  })
}

// ============================================================================
// Notification Preferences
// ============================================================================

/**
 * Get all notification preferences for a user
 * @param schoolId - School ID
 * @param userId - User ID
 * @returns Promise with preferences
 */
export async function getUserNotificationPreferences(
  schoolId: string,
  userId: string
) {
  return db.notificationPreference.findMany({
    where: {
      schoolId,
      userId,
    },
    select: notificationPreferenceSelect,
  })
}

/**
 * Get a specific notification preference
 * @param schoolId - School ID
 * @param userId - User ID
 * @param type - Notification type
 * @param channel - Notification channel
 * @returns Promise with preference or null
 */
export async function getNotificationPreference(
  schoolId: string,
  userId: string,
  type: NotificationType,
  channel: NotificationChannel
) {
  return db.notificationPreference.findFirst({
    where: {
      schoolId,
      userId,
      type,
      channel,
    },
    select: notificationPreferenceSelect,
  })
}

/**
 * Check if user should receive notification based on preferences
 * @param schoolId - School ID
 * @param userId - User ID
 * @param type - Notification type
 * @param channel - Notification channel
 * @returns Promise with boolean
 */
export async function shouldSendNotification(
  schoolId: string,
  userId: string,
  type: NotificationType,
  channel: NotificationChannel
): Promise<boolean> {
  const preference = await getNotificationPreference(
    schoolId,
    userId,
    type,
    channel
  )

  if (!preference) {
    // Default: send notification if no preference set
    return true
  }

  if (!preference.enabled) {
    return false
  }

  // Check quiet hours
  if (
    preference.quietHoursStart !== null &&
    preference.quietHoursEnd !== null
  ) {
    const now = new Date()
    const currentHour = now.getHours()

    if (preference.quietHoursStart < preference.quietHoursEnd) {
      // Normal range (e.g., 22-8)
      if (
        currentHour >= preference.quietHoursStart &&
        currentHour < preference.quietHoursEnd
      ) {
        return false
      }
    } else {
      // Overnight range (e.g., 22-8 next day)
      if (
        currentHour >= preference.quietHoursStart ||
        currentHour < preference.quietHoursEnd
      ) {
        return false
      }
    }
  }

  return true
}

// ============================================================================
// Notification Subscriptions
// ============================================================================

/**
 * Get user's active subscriptions
 * @param schoolId - School ID
 * @param userId - User ID
 * @returns Promise with subscriptions
 */
export async function getUserNotificationSubscriptions(
  schoolId: string,
  userId: string
) {
  return db.notificationSubscription.findMany({
    where: {
      schoolId,
      userId,
      active: true,
    },
    select: {
      id: true,
      entityType: true,
      entityId: true,
      active: true,
      createdAt: true,
    },
  })
}

/**
 * Check if user is subscribed to an entity
 * @param schoolId - School ID
 * @param userId - User ID
 * @param entityType - Entity type
 * @param entityId - Entity ID
 * @returns Promise with boolean
 */
export async function isUserSubscribed(
  schoolId: string,
  userId: string,
  entityType: string,
  entityId: string
): Promise<boolean> {
  const subscription = await db.notificationSubscription.findFirst({
    where: {
      schoolId,
      userId,
      entityType,
      entityId,
      active: true,
    },
  })

  return subscription !== null
}

/**
 * Get all subscribers for an entity
 * @param schoolId - School ID
 * @param entityType - Entity type
 * @param entityId - Entity ID
 * @returns Promise with user IDs
 */
export async function getEntitySubscribers(
  schoolId: string,
  entityType: string,
  entityId: string
): Promise<string[]> {
  const subscriptions = await db.notificationSubscription.findMany({
    where: {
      schoolId,
      entityType,
      entityId,
      active: true,
    },
    select: {
      userId: true,
    },
  })

  return subscriptions.map((s) => s.userId)
}

// ============================================================================
// Bulk Query Functions
// ============================================================================

/**
 * Check if multiple notifications exist and belong to user
 * @param schoolId - School ID
 * @param userId - User ID
 * @param notificationIds - Array of notification IDs
 * @returns Promise with array of found IDs
 */
export async function verifyNotificationOwnership(
  schoolId: string,
  userId: string,
  notificationIds: string[]
) {
  const notifications = await db.notification.findMany({
    where: {
      id: { in: notificationIds },
      schoolId,
      userId,
    },
    select: {
      id: true,
    },
  })

  return notifications.map((n) => n.id)
}

/**
 * Get notifications by multiple IDs
 * @param schoolId - School ID
 * @param userId - User ID
 * @param notificationIds - Array of notification IDs
 * @returns Promise with notifications
 */
export async function getNotificationsByIds(
  schoolId: string,
  userId: string,
  notificationIds: string[]
) {
  return db.notification.findMany({
    where: {
      id: { in: notificationIds },
      schoolId,
      userId,
    },
    select: notificationDetailSelect,
  })
}

/**
 * Get pending email notifications to send
 * @param schoolId - School ID (optional)
 * @param limit - Maximum number to return
 * @returns Promise with notifications pending email
 */
export async function getPendingEmailNotifications(
  schoolId?: string,
  limit = 100
) {
  const where: Prisma.NotificationWhereInput = {
    ...(schoolId && { schoolId }),
    emailSent: false,
    channels: {
      has: "email",
    },
  }

  return db.notification.findMany({
    where,
    take: limit,
    select: {
      id: true,
      schoolId: true,
      userId: true,
      type: true,
      title: true,
      body: true,
      metadata: true,
      user: {
        select: {
          email: true,
          username: true,
        },
      },
    },
  })
}
