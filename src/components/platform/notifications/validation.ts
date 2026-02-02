/**
 * Notification System Validation
 *
 * Multi-channel notification delivery system with:
 * - 21 notification types: Academic (assignments, grades), operational (fees, class changes), system alerts
 * - 4 delivery channels: In-app, email, push (mobile), SMS
 * - 4 priority levels: Low, normal, high, urgent (affects delivery urgency)
 * - Quiet hours: User-defined do-not-disturb windows (e.g., 9pm-8am)
 * - Digest mode: Batch notifications daily/weekly (reduces notification fatigue)
 * - Batch creation: Send to role (all teachers), class, or user list
 * - Scheduling: Future-dated notifications (e.g., "remind in 2 days")
 * - Expiration: Auto-delete old notifications (default: keep forever)
 * - Read status: Track read/unread for important notifications
 *
 * Key validation rules:
 * - Title/body: Required, reasonable length (255/no limit)
 * - Priority: Low=info (e.g., new document), urgent=security (e.g., login alert)
 * - Channels: Default in_app, opt-in for email/SMS (prevent spam)
 * - Quiet hours: Both start+end required together (can't have just start)
 * - Digest: Only when digestEnabled=true (prevents orphaned frequency)
 * - Batch: At least one target required (role OR class OR user IDs)
 * - Date range: startDate < endDate (for filters)
 * - Expiration: Must be future (don't create already-expired notifications)
 *
 * Why these types:
 * - Academic: Students care about grades, assignments, attendance
 * - Operational: Fees affect payment, class changes affect schedule
 * - System: Security alerts (login) and account events (password reset)
 *
 * Why batch + scheduling:
 * - Batch: Send 500 students 1 notification vs 500 separate calls
 * - Schedule: "Send at 3pm" = coordinated time across timezones
 * - Target: By role (all admins) or class (period 2 math) enables scalability
 */

import { UserRole } from "@prisma/client"
import { z } from "zod"

// Notification type enum validation
export const notificationTypeSchema = z.enum([
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
  "absence_intention",
  "absence_intention_decision",
])

export const notificationPrioritySchema = z.enum([
  "low",
  "normal",
  "high",
  "urgent",
])

export const notificationChannelSchema = z.enum([
  "in_app",
  "email",
  "push",
  "sms",
])

// Create notification schema
export const createNotificationSchema = z
  .object({
    userId: z.string().min(1, "User ID is required"),
    type: notificationTypeSchema,
    priority: notificationPrioritySchema.optional().default("normal"),
    title: z
      .string()
      .min(1, "Title is required")
      .max(255, "Title must be less than 255 characters"),
    body: z.string().min(1, "Body is required"),
    metadata: z.record(z.string(), z.unknown()).optional(),
    actorId: z.string().optional(),
    channels: z.array(notificationChannelSchema).optional().default(["in_app"]),
    expiresAt: z.string().datetime().optional().or(z.literal("")),
  })
  .superRefine((val, ctx) => {
    // Validate expiration is in the future
    if (val.expiresAt && val.expiresAt !== "") {
      const expiresDate = new Date(val.expiresAt)
      if (expiresDate <= new Date()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Expiration date must be in the future",
          path: ["expiresAt"],
        })
      }
    }
  })

// Update notification schema (partial)
export const updateNotificationSchema = z.object({
  id: z.string().min(1, "Notification ID is required"),
  read: z.boolean().optional(),
  readAt: z.string().datetime().optional(),
})

// Mark notification as read schema
export const markNotificationReadSchema = z.object({
  notificationId: z.string().min(1, "Notification ID is required"),
})

// Mark all notifications as read schema
export const markAllNotificationsReadSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  type: notificationTypeSchema.optional(),
})

// Delete notification schema
export const deleteNotificationSchema = z.object({
  notificationId: z.string().min(1, "Notification ID is required"),
})

// Batch notification creation schema
export const createNotificationBatchSchema = z
  .object({
    type: notificationTypeSchema,
    title: z
      .string()
      .min(1, "Title is required")
      .max(255, "Title must be less than 255 characters"),
    body: z.string().min(1, "Body is required"),
    targetRole: z.nativeEnum(UserRole).optional(),
    targetClassId: z.string().optional(),
    targetUserIds: z.array(z.string()).optional(),
    scheduledFor: z.string().datetime().optional().or(z.literal("")),
  })
  .superRefine((val, ctx) => {
    // At least one target must be specified
    if (
      !val.targetRole &&
      !val.targetClassId &&
      (!val.targetUserIds || val.targetUserIds.length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "At least one target (role, class, or user IDs) must be specified",
        path: ["targetRole"],
      })
    }

    // Validate scheduled date is in the future
    if (val.scheduledFor && val.scheduledFor !== "") {
      const scheduledDate = new Date(val.scheduledFor)
      if (scheduledDate <= new Date()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Scheduled date must be in the future",
          path: ["scheduledFor"],
        })
      }
    }
  })

// Notification preference schema
export const notificationPreferenceSchema = z
  .object({
    type: notificationTypeSchema,
    channel: notificationChannelSchema,
    enabled: z.boolean().default(true),
    quietHoursStart: z.number().int().min(0).max(23).optional(),
    quietHoursEnd: z.number().int().min(0).max(23).optional(),
    digestEnabled: z.boolean().optional().default(false),
    digestFrequency: z.enum(["daily", "weekly"]).optional(),
  })
  .superRefine((val, ctx) => {
    // Validate quiet hours - must be paired
    // Why: If user sets quiet hours, need both start and end to calculate the window
    // Example: start=9pm, no end = ambiguous (9pm to when?)
    if (val.quietHoursStart !== undefined && val.quietHoursEnd !== undefined) {
      if (val.quietHoursStart === val.quietHoursEnd) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Quiet hours start and end cannot be the same",
          path: ["quietHoursStart"],
        })
      }
    }

    // If quiet hours start is set, end must be set
    if (val.quietHoursStart !== undefined && val.quietHoursEnd === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Quiet hours end is required when start is set",
        path: ["quietHoursEnd"],
      })
    }

    // If quiet hours end is set, start must be set
    if (val.quietHoursEnd !== undefined && val.quietHoursStart === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Quiet hours start is required when end is set",
        path: ["quietHoursStart"],
      })
    }

    // If digest is enabled, frequency must be set
    // Why: digestEnabled=true but no frequency = system won't know when to send digest
    if (val.digestEnabled && !val.digestFrequency) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Digest frequency is required when digest is enabled",
        path: ["digestFrequency"],
      })
    }
  })

// Update notification preferences schema
export const updateNotificationPreferencesSchema = z.array(
  notificationPreferenceSchema
)

// Notification filters schema
export const notificationFiltersSchema = z
  .object({
    type: z.array(notificationTypeSchema).optional(),
    priority: z.array(notificationPrioritySchema).optional(),
    read: z.boolean().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  })
  .superRefine((val, ctx) => {
    // Validate date range
    if (val.startDate && val.endDate) {
      const start = new Date(val.startDate)
      const end = new Date(val.endDate)
      if (start >= end) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Start date must be before end date",
          path: ["startDate"],
        })
      }
    }
  })

// Sort item schema for table sorting
export const sortItemSchema = z.object({
  id: z.string(),
  desc: z.boolean().optional(),
})

// Get notifications schema (with pagination and filters)
export const getNotificationsSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(200).default(20),
  type: z.string().optional().default(""),
  priority: z.string().optional().default(""),
  read: z.string().optional().default(""),
  search: z.string().optional().default(""),
  sort: z.array(sortItemSchema).optional().default([]),
})

// Get notification statistics schema
export const getNotificationStatsSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

// Get notification count schema
export const getNotificationCountSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  unreadOnly: z.boolean().optional().default(true),
})

// Notification subscription schema
export const notificationSubscriptionSchema = z.object({
  entityType: z.string().min(1, "Entity type is required"),
  entityId: z.string().min(1, "Entity ID is required"),
  active: z.boolean().optional().default(true),
})

// Update notification subscription schema
export const updateNotificationSubscriptionSchema = z.object({
  subscriptionId: z.string().min(1, "Subscription ID is required"),
  active: z.boolean(),
})
