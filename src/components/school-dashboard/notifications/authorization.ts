/**
 * Authorization middleware for notifications feature
 * Implements role-based access control (RBAC) for notification operations
 */

import { NotificationType, UserRole } from "@prisma/client"

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

  // TEACHER can send certain types of notifications
  if (role === "TEACHER") {
    if (action === "create") {
      // Teachers can send assignment, grade, and class-related notifications
      const allowedTypes: NotificationType[] = [
        "assignment_created",
        "assignment_due",
        "assignment_graded",
        "grade_posted",
        "class_cancelled",
        "class_rescheduled",
      ]

      if (!notification?.type) return false
      return allowedTypes.includes(notification.type)
    }

    if (action === "send_batch") {
      // Teachers can send batch notifications to their classes only
      return notification?.targetRole === undefined // No role targeting
    }
  }

  // ACCOUNTANT can send fee-related notifications
  if (role === "ACCOUNTANT") {
    if (action === "create") {
      const allowedTypes: NotificationType[] = [
        "fee_due",
        "fee_overdue",
        "fee_paid",
      ]

      if (!notification?.type) return false
      return allowedTypes.includes(notification.type)
    }

    if (action === "send_batch") {
      // Accountants can send batch fee notifications
      return true
    }
  }

  // STAFF can send limited notification types
  if (role === "STAFF") {
    if (action === "create") {
      const allowedTypes: NotificationType[] = [
        "document_shared",
        "event_reminder",
      ]

      if (!notification?.type) return false
      return allowedTypes.includes(notification.type)
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

  const roleNotificationMap: Record<UserRole, NotificationType[]> = {
    DEVELOPER: [], // Handled above
    ADMIN: [], // Handled above
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

  return roleNotificationMap[role]?.includes(type) ?? false
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
    // Return all notification types
    return [
      "message",
      "message_mention",
      "assignment_created",
      "assignment_due",
      "assignment_graded",
      "grade_posted",
      "attendance_marked",
      "attendance_alert",
      "fee_due",
      "fee_overdue",
      "fee_paid",
      "announcement",
      "event_reminder",
      "class_cancelled",
      "class_rescheduled",
      "system_alert",
      "account_created",
      "password_reset",
      "login_alert",
      "document_shared",
      "report_ready",
    ]
  }

  const roleNotificationMap: Record<UserRole, NotificationType[]> = {
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

  return roleNotificationMap[role] ?? []
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
