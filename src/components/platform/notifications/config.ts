import type {
  NotificationType,
  NotificationPriority,
  NotificationChannel,
} from "@prisma/client"
import {
  Bell,
  MessageSquare,
  BookOpen,
  Calendar,
  DollarSign,
  Megaphone,
  UserCheck,
  AlertTriangle,
  FileText,
  Shield,
  type LucideIcon,
} from "lucide-react"

// Notification type configurations
export const NOTIFICATION_TYPE_CONFIG: Record<
  NotificationType,
  {
    icon: LucideIcon
    color: string // Semantic color token
    requiresAction: boolean
  }
> = {
  message: {
    icon: MessageSquare,
    color: "text-blue-600",
    requiresAction: true,
  },
  message_mention: {
    icon: MessageSquare,
    color: "text-purple-600",
    requiresAction: true,
  },
  assignment_created: {
    icon: BookOpen,
    color: "text-indigo-600",
    requiresAction: true,
  },
  assignment_due: {
    icon: Calendar,
    color: "text-orange-600",
    requiresAction: true,
  },
  assignment_graded: {
    icon: FileText,
    color: "text-green-600",
    requiresAction: false,
  },
  grade_posted: {
    icon: FileText,
    color: "text-green-600",
    requiresAction: false,
  },
  attendance_marked: {
    icon: UserCheck,
    color: "text-teal-600",
    requiresAction: false,
  },
  attendance_alert: {
    icon: AlertTriangle,
    color: "text-red-600",
    requiresAction: true,
  },
  fee_due: {
    icon: DollarSign,
    color: "text-amber-600",
    requiresAction: true,
  },
  fee_overdue: {
    icon: AlertTriangle,
    color: "text-red-600",
    requiresAction: true,
  },
  fee_paid: {
    icon: DollarSign,
    color: "text-green-600",
    requiresAction: false,
  },
  announcement: {
    icon: Megaphone,
    color: "text-blue-600",
    requiresAction: false,
  },
  event_reminder: {
    icon: Calendar,
    color: "text-purple-600",
    requiresAction: false,
  },
  class_cancelled: {
    icon: AlertTriangle,
    color: "text-red-600",
    requiresAction: false,
  },
  class_rescheduled: {
    icon: Calendar,
    color: "text-orange-600",
    requiresAction: false,
  },
  system_alert: {
    icon: Bell,
    color: "text-red-600",
    requiresAction: true,
  },
  account_created: {
    icon: Shield,
    color: "text-green-600",
    requiresAction: false,
  },
  password_reset: {
    icon: Shield,
    color: "text-orange-600",
    requiresAction: true,
  },
  login_alert: {
    icon: Shield,
    color: "text-red-600",
    requiresAction: true,
  },
  document_shared: {
    icon: FileText,
    color: "text-blue-600",
    requiresAction: true,
  },
  report_ready: {
    icon: FileText,
    color: "text-green-600",
    requiresAction: true,
  },
}

// Priority configurations
export const PRIORITY_CONFIG: Record<
  NotificationPriority,
  {
    label: string
    color: string
    badgeVariant: "default" | "secondary" | "destructive" | "outline"
  }
> = {
  low: {
    label: "Low",
    color: "text-muted-foreground",
    badgeVariant: "secondary",
  },
  normal: {
    label: "Normal",
    color: "text-foreground",
    badgeVariant: "default",
  },
  high: {
    label: "High",
    color: "text-orange-600",
    badgeVariant: "outline",
  },
  urgent: {
    label: "Urgent",
    color: "text-destructive",
    badgeVariant: "destructive",
  },
}

// Channel configurations
export const CHANNEL_CONFIG: Record<
  NotificationChannel,
  {
    label: string
    description: string
    enabled: boolean // Whether it's currently implemented
  }
> = {
  in_app: {
    label: "In-App",
    description: "Notifications within the application",
    enabled: true,
  },
  email: {
    label: "Email",
    description: "Email notifications",
    enabled: true,
  },
  push: {
    label: "Push",
    description: "Browser push notifications (coming soon)",
    enabled: false,
  },
  sms: {
    label: "SMS",
    description: "Text message notifications (coming soon)",
    enabled: false,
  },
}

// Default notification preferences by user role
export const DEFAULT_NOTIFICATION_PREFERENCES: Record<
  string,
  Record<NotificationChannel, boolean>
> = {
  ADMIN: {
    in_app: true,
    email: true,
    push: false,
    sms: false,
  },
  TEACHER: {
    in_app: true,
    email: true,
    push: false,
    sms: false,
  },
  STUDENT: {
    in_app: true,
    email: false,
    push: false,
    sms: false,
  },
  GUARDIAN: {
    in_app: true,
    email: true,
    push: false,
    sms: false,
  },
  ACCOUNTANT: {
    in_app: true,
    email: true,
    push: false,
    sms: false,
  },
  STAFF: {
    in_app: true,
    email: false,
    push: false,
    sms: false,
  },
}

// Notification expiration times (in days)
export const NOTIFICATION_EXPIRATION: Record<NotificationType, number | null> = {
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
}

// Pagination and limits
export const NOTIFICATIONS_PER_PAGE = 20
export const MAX_NOTIFICATIONS_DISPLAY = 100
export const NOTIFICATION_BELL_MAX_DISPLAY = 5

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
export const DIGEST_FREQUENCY_OPTIONS = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
] as const

// Filter options for notification center
export const NOTIFICATION_FILTERS = {
  all: "All",
  unread: "Unread",
  messages: "Messages",
  assignments: "Assignments",
  grades: "Grades",
  attendance: "Attendance",
  fees: "Fees",
  announcements: "Announcements",
  system: "System",
} as const
