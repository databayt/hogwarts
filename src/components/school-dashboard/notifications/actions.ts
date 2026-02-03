"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { auth } from "@/auth"
import { NotificationChannel, NotificationType, Prisma } from "@prisma/client"
import { z } from "zod"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  assertNotificationPermission,
  getAuthContext,
  validateNotificationType,
} from "./authorization"
import { NOTIFICATION_EXPIRATION } from "./config"
import {
  createNotificationBatchSchema,
  createNotificationSchema,
  deleteNotificationSchema,
  getNotificationsSchema,
  markAllNotificationsReadSchema,
  markNotificationReadSchema,
  notificationPreferenceSchema,
  notificationSubscriptionSchema,
  updateNotificationPreferencesSchema,
  updateNotificationSchema,
  updateNotificationSubscriptionSchema,
} from "./validation"

// ============================================================================
// Types
// ============================================================================

export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

// ============================================================================
// Constants
// ============================================================================

const NOTIFICATIONS_PATH = "/notifications"

// ============================================================================
// Notification CRUD Operations
// ============================================================================

/**
 * Create a new notification
 * @param input - Notification data
 * @returns Action response with notification ID
 */
export async function createNotification(
  input: z.infer<typeof createNotificationSchema>
): Promise<ActionResponse<{ id: string }>> {
  try {
    // Get authentication context
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return { success: false, error: "Not authenticated" }
    }

    // Get tenant context
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    // Parse and validate input
    const parsed = createNotificationSchema.parse(input)

    // Validate notification type permissions
    try {
      validateNotificationType(authContext, parsed.type)
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Invalid notification type",
      }
    }

    // Check create permission
    try {
      assertNotificationPermission(authContext, "create", {
        type: parsed.type,
        userId: parsed.userId,
      })
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unauthorized to create notifications",
      }
    }

    // Calculate expiration if not provided
    const expiresAt = parsed.expiresAt
      ? new Date(parsed.expiresAt)
      : NOTIFICATION_EXPIRATION[parsed.type]
        ? new Date(
            Date.now() +
              NOTIFICATION_EXPIRATION[parsed.type]! * 24 * 60 * 60 * 1000
          )
        : null

    // Create notification
    const row = await db.notification.create({
      data: {
        schoolId,
        userId: parsed.userId,
        type: parsed.type,
        priority: parsed.priority || "normal",
        title: parsed.title,
        body: parsed.body,
        metadata: parsed.metadata
          ? (parsed.metadata as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        actorId: parsed.actorId || authContext.userId,
        channels: parsed.channels || ["in_app"],
        expiresAt,
      },
    })

    // Revalidate cache
    revalidatePath(NOTIFICATIONS_PATH)
    revalidateTag(`notifications-${schoolId}`, "max")
    revalidateTag(`notifications-${parsed.userId}`, "max")

    return { success: true, data: { id: row.id } }
  } catch (error) {
    console.error("[createNotification] Error:", error, {
      input,
      timestamp: new Date().toISOString(),
    })

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create notification",
    }
  }
}

/**
 * Mark a notification as read
 * @param input - Notification ID
 * @returns Action response
 */
export async function markNotificationAsRead(
  input: z.infer<typeof markNotificationReadSchema>
): Promise<ActionResponse<void>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const parsed = markNotificationReadSchema.parse(input)

    // Fetch notification to verify ownership
    const existing = await db.notification.findFirst({
      where: {
        id: parsed.notificationId,
        schoolId,
      },
      select: { id: true, userId: true, read: true },
    })

    if (!existing) {
      return { success: false, error: "Notification not found" }
    }

    // Check permission
    try {
      assertNotificationPermission(authContext, "mark_read", {
        id: existing.id,
        userId: existing.userId,
      })
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unauthorized to mark notification as read",
      }
    }

    // Skip if already read
    if (existing.read) {
      return { success: true, data: undefined }
    }

    // Mark as read
    await db.notification.updateMany({
      where: {
        id: parsed.notificationId,
        schoolId,
        userId: authContext.userId,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    })

    revalidatePath(NOTIFICATIONS_PATH)
    revalidateTag(`notifications-${schoolId}`, "max")
    revalidateTag(`notifications-${authContext.userId}`, "max")

    return { success: true, data: undefined }
  } catch (error) {
    console.error("[markNotificationAsRead] Error:", error, {
      input,
      timestamp: new Date().toISOString(),
    })

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to mark notification as read",
    }
  }
}

/**
 * Mark all notifications as read for a user
 * @param input - User ID and optional type filter
 * @returns Action response with count
 */
export async function markAllNotificationsAsRead(
  input: z.infer<typeof markAllNotificationsReadSchema>
): Promise<ActionResponse<{ count: number }>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const parsed = markAllNotificationsReadSchema.parse(input)

    // Verify user can only mark their own notifications
    if (parsed.userId !== authContext.userId) {
      return {
        success: false,
        error: "Cannot mark other users' notifications as read",
      }
    }

    // Build where clause
    const where = {
      schoolId,
      userId: parsed.userId,
      read: false,
      ...(parsed.type && { type: parsed.type }),
    }

    // Mark all as read
    const result = await db.notification.updateMany({
      where,
      data: {
        read: true,
        readAt: new Date(),
      },
    })

    revalidatePath(NOTIFICATIONS_PATH)
    revalidateTag(`notifications-${schoolId}`, "max")
    revalidateTag(`notifications-${authContext.userId}`, "max")

    return { success: true, data: { count: result.count } }
  } catch (error) {
    console.error("[markAllNotificationsAsRead] Error:", error, {
      input,
      timestamp: new Date().toISOString(),
    })

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to mark all notifications as read",
    }
  }
}

/**
 * Delete a notification
 * @param input - Notification ID
 * @returns Action response
 */
export async function deleteNotification(
  input: z.infer<typeof deleteNotificationSchema>
): Promise<ActionResponse<void>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const parsed = deleteNotificationSchema.parse(input)

    // Fetch notification to verify ownership
    const existing = await db.notification.findFirst({
      where: {
        id: parsed.notificationId,
        schoolId,
      },
      select: { id: true, userId: true },
    })

    if (!existing) {
      return { success: false, error: "Notification not found" }
    }

    // Check permission
    try {
      assertNotificationPermission(authContext, "delete", {
        id: existing.id,
        userId: existing.userId,
      })
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unauthorized to delete notification",
      }
    }

    // Delete notification
    await db.notification.deleteMany({
      where: {
        id: parsed.notificationId,
        schoolId,
        userId: authContext.userId,
      },
    })

    revalidatePath(NOTIFICATIONS_PATH)
    revalidateTag(`notifications-${schoolId}`, "max")
    revalidateTag(`notifications-${authContext.userId}`, "max")

    return { success: true, data: undefined }
  } catch (error) {
    console.error("[deleteNotification] Error:", error, {
      input,
      timestamp: new Date().toISOString(),
    })

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete notification",
    }
  }
}

// ============================================================================
// Batch Notifications
// ============================================================================

/**
 * Create a batch of notifications
 * @param input - Batch notification data
 * @returns Action response with batch ID
 */
export async function createNotificationBatch(
  input: z.infer<typeof createNotificationBatchSchema>
): Promise<ActionResponse<{ batchId: string; count: number }>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const parsed = createNotificationBatchSchema.parse(input)

    // Validate notification type permissions
    try {
      validateNotificationType(authContext, parsed.type)
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Invalid notification type",
      }
    }

    // Check batch send permission
    try {
      assertNotificationPermission(authContext, "send_batch", {
        type: parsed.type,
        targetRole: parsed.targetRole,
        targetUserIds: parsed.targetUserIds,
      })
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unauthorized to send batch notifications",
      }
    }

    // Create batch record
    const batch = await db.notificationBatch.create({
      data: {
        schoolId,
        type: parsed.type,
        title: parsed.title,
        body: parsed.body,
        targetRole: parsed.targetRole ?? null,
        targetClassId: parsed.targetClassId || null,
        targetUserIds: parsed.targetUserIds || [],
        scheduledFor: parsed.scheduledFor
          ? new Date(parsed.scheduledFor)
          : null,
        createdBy: authContext.userId,
        status: "pending",
      },
    })

    revalidatePath(NOTIFICATIONS_PATH)
    revalidateTag(`notifications-${schoolId}`, "max")

    // Note: Actual notification creation would be handled by a background job
    // For now, we return the batch ID and count of 0
    return {
      success: true,
      data: { batchId: batch.id, count: 0 },
    }
  } catch (error) {
    console.error("[createNotificationBatch] Error:", error, {
      input,
      timestamp: new Date().toISOString(),
    })

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create notification batch",
    }
  }
}

// ============================================================================
// Notification Preferences
// ============================================================================

/**
 * Update notification preferences for a user
 * @param input - Array of preference settings
 * @returns Action response
 */
export async function updateNotificationPreferences(
  input: z.infer<typeof updateNotificationPreferencesSchema>
): Promise<ActionResponse<{ count: number }>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const parsed = updateNotificationPreferencesSchema.parse(input)

    // Check permission
    try {
      assertNotificationPermission(authContext, "manage_preferences")
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unauthorized to manage preferences",
      }
    }

    // Upsert each preference
    let count = 0
    for (const pref of parsed) {
      await db.notificationPreference.upsert({
        where: {
          userId_type_channel: {
            userId: authContext.userId,
            type: pref.type,
            channel: pref.channel,
          },
        },
        create: {
          schoolId,
          userId: authContext.userId,
          type: pref.type,
          channel: pref.channel,
          enabled: pref.enabled,
          quietHoursStart: pref.quietHoursStart ?? null,
          quietHoursEnd: pref.quietHoursEnd ?? null,
          digestEnabled: pref.digestEnabled ?? false,
          digestFrequency: pref.digestFrequency ?? null,
        },
        update: {
          enabled: pref.enabled,
          quietHoursStart: pref.quietHoursStart ?? null,
          quietHoursEnd: pref.quietHoursEnd ?? null,
          digestEnabled: pref.digestEnabled ?? false,
          digestFrequency: pref.digestFrequency ?? null,
        },
      })
      count++
    }

    revalidatePath(NOTIFICATIONS_PATH)
    revalidateTag(`notification-preferences-${authContext.userId}`, "max")

    return { success: true, data: { count } }
  } catch (error) {
    console.error("[updateNotificationPreferences] Error:", error, {
      input,
      timestamp: new Date().toISOString(),
    })

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update notification preferences",
    }
  }
}

// ============================================================================
// Notification Subscriptions
// ============================================================================

/**
 * Subscribe to entity notifications
 * @param input - Subscription data
 * @returns Action response with subscription ID
 */
export async function subscribeToEntityNotifications(
  input: z.infer<typeof notificationSubscriptionSchema>
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const parsed = notificationSubscriptionSchema.parse(input)

    // Check permission
    try {
      assertNotificationPermission(authContext, "subscribe")
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unauthorized to subscribe",
      }
    }

    // Upsert subscription
    const subscription = await db.notificationSubscription.upsert({
      where: {
        userId_entityType_entityId: {
          userId: authContext.userId,
          entityType: parsed.entityType,
          entityId: parsed.entityId,
        },
      },
      create: {
        schoolId,
        userId: authContext.userId,
        entityType: parsed.entityType,
        entityId: parsed.entityId,
        active: parsed.active ?? true,
      },
      update: {
        active: parsed.active ?? true,
      },
    })

    revalidatePath(NOTIFICATIONS_PATH)
    revalidateTag(`notification-subscriptions-${authContext.userId}`, "max")

    return { success: true, data: { id: subscription.id } }
  } catch (error) {
    console.error("[subscribeToEntityNotifications] Error:", error, {
      input,
      timestamp: new Date().toISOString(),
    })

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to subscribe",
    }
  }
}

/**
 * Unsubscribe from entity notifications
 * @param input - Subscription update data
 * @returns Action response
 */
export async function unsubscribeFromEntityNotifications(
  input: z.infer<typeof updateNotificationSubscriptionSchema>
): Promise<ActionResponse<void>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const parsed = updateNotificationSubscriptionSchema.parse(input)

    // Update subscription
    await db.notificationSubscription.updateMany({
      where: {
        id: parsed.subscriptionId,
        schoolId,
        userId: authContext.userId,
      },
      data: {
        active: parsed.active,
      },
    })

    revalidatePath(NOTIFICATIONS_PATH)
    revalidateTag(`notification-subscriptions-${authContext.userId}`, "max")

    return { success: true, data: undefined }
  } catch (error) {
    console.error("[unsubscribeFromEntityNotifications] Error:", error, {
      input,
      timestamp: new Date().toISOString(),
    })

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to unsubscribe",
    }
  }
}
