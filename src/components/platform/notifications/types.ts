import type { UseFormReturn } from "react-hook-form"
import type { z } from "zod"
import type {
  NotificationType,
  NotificationPriority,
  NotificationChannel,
  Notification,
  NotificationPreference,
} from "@prisma/client"

// DTO types for API responses (dates are serialized as ISO strings for client components)
export type NotificationDTO = {
  id: string
  schoolId: string
  userId: string
  type: NotificationType
  priority: NotificationPriority
  title: string
  body: string
  metadata: Record<string, unknown> | null
  actorId: string | null
  actor: {
    id: string
    username: string | null
    email: string | null
    image: string | null
  } | null
  read: boolean
  readAt: string | null
  channels: NotificationChannel[]
  emailSent: boolean
  emailSentAt: string | null
  createdAt: string
  updatedAt: string
}

// Table row type for data tables
export type NotificationRow = {
  id: string
  type: NotificationType
  priority: NotificationPriority
  title: string
  read: boolean
  actorName: string | null
  createdAt: string
}

// Notification preferences DTO
export type NotificationPreferenceDTO = {
  id: string
  schoolId: string
  userId: string
  type: NotificationType
  channel: NotificationChannel
  enabled: boolean
  quietHoursStart: number | null
  quietHoursEnd: number | null
  digestEnabled: boolean
  digestFrequency: string | null
}

// Notification statistics
export type NotificationStats = {
  total: number
  unread: number
  today: number
  thisWeek: number
  byType: Record<NotificationType, number>
  byPriority: Record<NotificationPriority, number>
}

// Notification filters
export type NotificationFilters = {
  type?: NotificationType[]
  priority?: NotificationPriority[]
  read?: boolean
  startDate?: Date
  endDate?: Date
}

// Notification with includes (for detailed view)
export type NotificationWithActor = Notification & {
  actor: {
    id: string
    username: string | null
    email: string | null
    image: string | null
  } | null
}

// Notification creation payload
export type CreateNotificationPayload = {
  userId: string
  type: NotificationType
  priority?: NotificationPriority
  title: string
  body: string
  metadata?: Record<string, unknown>
  actorId?: string
  channels?: NotificationChannel[]
  expiresAt?: Date
}

// Notification batch creation payload
export type CreateNotificationBatchPayload = {
  type: NotificationType
  title: string
  body: string
  targetRole?: string
  targetClassId?: string
  targetUserIds?: string[]
  scheduledFor?: Date
}

// Notification preference update payload
export type UpdateNotificationPreferencePayload = {
  type: NotificationType
  channel: NotificationChannel
  enabled: boolean
  quietHoursStart?: number
  quietHoursEnd?: number
  digestEnabled?: boolean
  digestFrequency?: string
}

// Socket.IO event types
export type NotificationSocketEvents = {
  // Server → Client
  "notification:new": NotificationDTO
  "notification:read": { notificationId: string }
  "notification:deleted": { notificationId: string }
  "notification:count": { unread: number }

  // Client → Server
  "notification:mark_read": { notificationId: string }
  "notification:mark_all_read": { userId: string }
  "notification:subscribe": { userId: string }
  "notification:unsubscribe": { userId: string }
}

// Form props (for preference forms)
export interface NotificationPreferenceFormProps {
  form: UseFormReturn<any>
  isView: boolean
}

// Notification bell state
export type NotificationBellState = {
  count: number
  hasUnread: boolean
  loading: boolean
}

// Notification center state
export type NotificationCenterState = {
  notifications: NotificationDTO[]
  filters: NotificationFilters
  stats: NotificationStats
  loading: boolean
  hasMore: boolean
}
