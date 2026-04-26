// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Authorization middleware for notifications feature
 * Implements role-based access control (RBAC) for notification operations
 */

import { NotificationType, UserRole } from "@prisma/client"

/** Allowed notification send types per role (DEVELOPER/ADMIN handled separately) */
const ROLE_SEND_TYPES: Record<UserRole, NotificationType[]> = {
  DEVELOPER: [],
  ADMIN: [],
  TEACHER: [
    "assignment_created",
    "assignment_due",
    "assignment_graded",
    "grade_posted",
    "attendance_marked",
    "class_cancelled",
    "class_rescheduled",
  ],
  ACCOUNTANT: ["fee_due", "fee_overdue", "fee_paid"],
  STAFF: ["document_shared", "event_reminder"],
  STUDENT: [],
  GUARDIAN: [],
  USER: [],
}

export type NotificationAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "mark_read"
  | "manage_preferences"
  | "send_batch"
  | "subscribe"

export interface AuthContext {
  userId: string
  role: UserRole
  schoolId: string | null
}

export interface NotificationContext {
  id?: string
  userId?: string
  type?: NotificationType
  schoolId?: string
  targetRole?: string
  targetUserIds?: string[]
}

/**
 * Check if a user has permission to perform an action on a notification
 * @param auth - User authentication context
 * @param action - Action to perform
 * @param notification - Notification context (optional for create)
 * @returns true if authorized, false otherwise
 */
export function checkNotificationPermission(
  auth: AuthContext,
  action: NotificationAction,
  notification?: NotificationContext
): boolean {
  const { role, userId, schoolId } = auth

  // DEVELOPER role has full access
  if (role === "DEVELOPER") {
    return true
  }

  // Read own notifications
  if (action === "read") {
    if (!notification?.userId) return false
    return notification.userId === userId
  }

  // Mark own notifications as read
  if (action === "mark_read") {
    if (!notification?.userId) return false
    return notification.userId === userId
  }

  // Manage own notification preferences
  if (action === "manage_preferences") {
    return true // All authenticated users can manage their own preferences
  }

  // Subscribe/unsubscribe to entities
  if (action === "subscribe") {
    return true // All authenticated users can manage their own subscriptions
  }

  // Delete own notifications
  if (action === "delete") {
    if (!notification?.userId) return false
    return notification.userId === userId
  }

  // ADMIN can send notifications and create batches within their school
  if (role === "ADMIN") {
    if (action === "create" || action === "send_batch") {
      if (!schoolId) return false
      // ADMIN can send to anyone in their school
      return true
    }

    if (action === "update") {
      // ADMIN can update notifications in their school
      if (!schoolId || !notification?.schoolId) return false
      return schoolId === notification.schoolId
    }
  }

  // Role-specific create/send_batch permissions using shared type map
  if (role === "TEACHER" || role === "ACCOUNTANT" || role === "STAFF") {
    if (action === "create") {
      if (!notification?.type) return false
      return ROLE_SEND_TYPES[role].includes(notification.type)
    }

    if (action === "send_batch") {
      if (role === "TEACHER") {
        return notification?.targetRole === undefined // No role targeting
      }
      if (role === "ACCOUNTANT") {
        return true
      }
    }
  }

  // STUDENT, GUARDIAN, USER roles can only manage their own notifications
  // (read, mark_read, delete, preferences, subscribe already handled above)

  // Default: deny access
  return false
}

/**
 * Assert that user has permission, throw error if not authorized
 * @param auth - User authentication context
 * @param action - Action to perform
 * @param notification - Notification context
 * @throws Error if not authorized
 */
export function assertNotificationPermission(
  auth: AuthContext,
  action: NotificationAction,
  notification?: NotificationContext
): void {
  if (!checkNotificationPermission(auth, action, notification)) {
    throw new Error(
      `Unauthorized: ${auth.role} cannot perform ${action} on notification${
        notification?.id ? ` ${notification.id}` : ""
      }`
    )
  }
}

/**
 * Get user's authorization context from session
 * @param session - NextAuth session object
 * @returns AuthContext or null if not authenticated
 */
export function getAuthContext(session: any): AuthContext | null {
  if (!session?.user) return null

  return {
    userId: session.user.id,
    role: session.user.role as UserRole,
    schoolId: session.user.schoolId || null,
  }
}

/**
 * Check if user can send notifications of a specific type
 * @param role - User role
 * @param type - Notification type
 * @returns true if user can send this notification type
 */
export function canSendNotificationType(
  role: UserRole,
  type: NotificationType
): boolean {
  if (role === "DEVELOPER" || role === "ADMIN") {
    return true // Full access
  }

  return ROLE_SEND_TYPES[role]?.includes(type) ?? false
}

/**
 * Check if user can send batch notifications
 * @param role - User role
 * @returns true if user can send batch notifications
 */
export function canSendBatchNotifications(role: UserRole): boolean {
  return (
    role === "DEVELOPER" ||
    role === "ADMIN" ||
    role === "TEACHER" ||
    role === "ACCOUNTANT"
  )
}

/**
 * Check if user can manage notification preferences for others
 * @param role - User role
 * @returns true if user can manage others' preferences
 */
export function canManageOthersPreferences(role: UserRole): boolean {
  return role === "DEVELOPER" || role === "ADMIN"
}

/**
 * Get allowed notification types for a user role
 * @param role - User role
 * @returns Array of allowed notification types
 */
export function getAllowedNotificationTypes(
  role: UserRole
): NotificationType[] {
  if (role === "DEVELOPER" || role === "ADMIN") {
    // Source from Prisma enum to stay in sync when new types are added.
    // Avoids the historical bug where this list silently drifted from the
    // schema (e.g. absence_intention*, setup_guide were missing).
    return Object.values(NotificationType)
  }

  return ROLE_SEND_TYPES[role] ?? []
}

/**
 * Validate that notification type matches user's permissions
 * @param auth - User authentication context
 * @param type - Notification type
 * @throws Error if type is not allowed
 */
export function validateNotificationType(
  auth: AuthContext,
  type: NotificationType
): void {
  if (!canSendNotificationType(auth.role, type)) {
    throw new Error(
      `Unauthorized: ${auth.role} cannot send ${type} notifications`
    )
  }
}

/**
 * Check if user can target specific recipients
 * @param auth - User authentication context
 * @param targetUserIds - Target user IDs
 * @returns true if user can target these recipients
 */
export function canTargetRecipients(
  auth: AuthContext,
  targetUserIds: string[]
): boolean {
  const { role } = auth

  // DEVELOPER can target anyone
  if (role === "DEVELOPER") {
    return true
  }

  // ADMIN can target anyone in their school
  if (role === "ADMIN") {
    return true
  }

  // TEACHER can target students in their classes
  // This would require additional class membership checks
  if (role === "TEACHER") {
    return true // Simplified - would need class validation
  }

  // ACCOUNTANT can target anyone for fee notifications
  if (role === "ACCOUNTANT") {
    return true
  }

  // Others cannot target specific recipients
  return false
}
