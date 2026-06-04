// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { ElementType } from "react"
import type {
  NotificationChannel,
  NotificationPriority,
  NotificationType,
} from "@prisma/client"
import {
  Bell,
  BookOpen,
  Calendar,
  DollarSign,
  FileText,
  ListChecks,
  Megaphone,
  MessageSquare,
  Shield,
  TriangleAlert,
  UserCheck,
  Video,
} from "lucide-react"

// Notification type configurations
// Note: Icons use semantic color tokens for consistency and theme compatibility
export const NOTIFICATION_TYPE_CONFIG: Record<
  NotificationType,
  {
    icon: ElementType
    requiresAction: boolean
  }
> = {
  message: {
    icon: MessageSquare,
    requiresAction: true,
  },
  message_mention: {
    icon: MessageSquare,
    requiresAction: true,
  },
  assignment_created: {
    icon: BookOpen,
    requiresAction: true,
  },
  assignment_due: {
    icon: Calendar,
    requiresAction: true,
  },
  assignment_graded: {
    icon: FileText,
    requiresAction: false,
  },
  grade_posted: {
    icon: FileText,
    requiresAction: false,
  },
  attendance_marked: {
    icon: UserCheck,
    requiresAction: false,
  },
  attendance_alert: {
    icon: TriangleAlert,
    requiresAction: true,
  },
  fee_due: {
    icon: DollarSign,
    requiresAction: true,
  },
  fee_overdue: {
    icon: TriangleAlert,
    requiresAction: true,
  },
  fee_paid: {
    icon: DollarSign,
    requiresAction: false,
  },
  announcement: {
    icon: Megaphone,
    requiresAction: false,
  },
  event_reminder: {
    icon: Calendar,
    requiresAction: false,
  },
  class_cancelled: {
    icon: TriangleAlert,
    requiresAction: false,
  },
  class_rescheduled: {
    icon: Calendar,
    requiresAction: false,
  },
  system_alert: {
    icon: Bell,
    requiresAction: true,
  },
  account_created: {
    icon: Shield,
    requiresAction: false,
  },
  password_reset: {
    icon: Shield,
    requiresAction: true,
  },
  login_alert: {
    icon: Shield,
    requiresAction: true,
  },
  document_shared: {
    icon: FileText,
    requiresAction: true,
  },
  report_ready: {
    icon: FileText,
    requiresAction: true,
  },
  absence_intention: {
    icon: Calendar,
    requiresAction: true,
  },
  absence_intention_decision: {
    icon: Calendar,
    requiresAction: false,
  },
  setup_guide: {
    icon: ListChecks,
    requiresAction: true,
  },
  live_class_scheduled: {
    icon: Video,
    requiresAction: false,
  },
  live_class_starting_soon: {
    icon: Video,
    requiresAction: true,
  },
  live_class_started: {
    icon: Video,
    requiresAction: true,
  },
  live_class_cancelled: {
    icon: TriangleAlert,
    requiresAction: false,
  },
  live_class_recording_ready: {
    icon: Video,
    requiresAction: false,
  },
}

// Priority configurations
// Note: Labels should come from dictionary, colors use semantic tokens
export const PRIORITY_CONFIG: Record<
  NotificationPriority,
  {
    badgeVariant: "default" | "secondary" | "destructive" | "outline"
  }
> = {
  low: {
    badgeVariant: "secondary",
  },
  normal: {
    badgeVariant: "default",
  },
  high: {
    badgeVariant: "outline",
  },
  urgent: {
    badgeVariant: "destructive",
  },
}

// Channel configurations
// Note: Labels and descriptions should come from dictionary
export const CHANNEL_CONFIG: Record<
  NotificationChannel,
  {
    enabled: boolean // Whether it's currently implemented
  }
> = {
  in_app: {
    enabled: true,
  },
  email: {
    enabled: true,
  },
  push: {
    enabled: false,
  },
  sms: {
    enabled: false,
  },
  whatsapp: {
    enabled: false,
  },
}

// Default notification preferences by user role
export const DEFAULT_NOTIFICATION_PREFERENCES: Record<
  string,
  Record<NotificationChannel, boolean>
> = {
  DEVELOPER: {
    in_app: true,
    email: true,
    push: false,
    sms: false,
    whatsapp: false,
  },
  ADMIN: {
    in_app: true,
    email: true,
    push: false,
    sms: false,
    whatsapp: false,
  },
  TEACHER: {
    in_app: true,
    email: true,
    push: false,
    sms: false,
    whatsapp: false,
  },
  STUDENT: {
    in_app: true,
    email: false,
    push: false,
    sms: false,
    whatsapp: false,
  },
  GUARDIAN: {
    in_app: true,
    email: true,
    push: false,
    sms: false,
    whatsapp: false,
  },
  ACCOUNTANT: {
    in_app: true,
    email: true,
    push: false,
    sms: false,
    whatsapp: false,
  },
  STAFF: {
    in_app: true,
    email: false,
    push: false,
    sms: false,
    whatsapp: false,
  },
  USER: {
    in_app: true,
    email: false,
    push: false,
    sms: false,
    whatsapp: false,
  },
}

// Notification expiration times (in days)
export const NOTIFICATION_EXPIRATION: Record<NotificationType, number | null> =
  {
    message: 30,
    message_mention: 30,
    assignment_created: 60,
    assignment_due: 7,
    assignment_graded: 60,
    grade_posted: 90,
    attendance_marked: 30,
    attendance_alert: 7,
    fee_due: 30,
    fee_overdue: 30,
    fee_paid: 90,
    announcement: 90,
    event_reminder: 7,
    class_cancelled: 7,
    class_rescheduled: 7,
    system_alert: 30,
    account_created: 90,
    password_reset: 1,
    login_alert: 7,
    document_shared: 60,
    report_ready: 30,
    absence_intention: 14,
    absence_intention_decision: 14,
    setup_guide: 30,
    live_class_scheduled: 14,
    live_class_starting_soon: 1,
    live_class_started: 1,
    live_class_cancelled: 14,
    live_class_recording_ready: 90,
  }

// Pagination and limits
export const NOTIFICATIONS_PER_PAGE = 20
export const MAX_NOTIFICATIONS_DISPLAY = 100
export const NOTIFICATION_BELL_MAX_DISPLAY = 5

// Filter tabs for the notification center
// Why: Used by the center.tsx tabs (all/unread) and exposed for tests/consumers
//      that need to enumerate the available filter modes without hardcoding
export const NOTIFICATION_FILTER_TYPES = ["all", "unread"] as const
export type NotificationFilterType = (typeof NOTIFICATION_FILTER_TYPES)[number]

// Socket.IO event names
export const SOCKET_EVENTS = {
  NEW_NOTIFICATION: "notification:new",
  NOTIFICATION_READ: "notification:read",
  NOTIFICATION_DELETED: "notification:deleted",
  NOTIFICATION_COUNT: "notification:count",
  MARK_READ: "notification:mark_read",
  MARK_ALL_READ: "notification:mark_all_read",
  SUBSCRIBE: "notification:subscribe",
  UNSUBSCRIBE: "notification:unsubscribe",
} as const

// Quiet hours defaults
export const DEFAULT_QUIET_HOURS = {
  start: 22, // 10 PM
  end: 8, // 8 AM
}

// Digest frequency options
// Note: Labels should come from dictionary (dictionary.preferences.digest.daily/weekly)
export const DIGEST_FREQUENCY_OPTIONS = ["daily", "weekly"] as const
