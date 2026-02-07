import * as z from "zod"

// Template schemas
export const templateSchema = z.object({
  type: z.enum([
    "message",
    "message_mention",
    "assignment_created",
    "assignment_due",
    "assignment_graded",
    "grade_posted",
    "attendance_marked",
    "attendance_alert",
    "absence_intention",
    "absence_intention_decision",
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
  ]),
  channel: z.enum(["in_app", "email", "push", "sms"]),
  title: z.string().min(1).max(255),
  body: z.string().min(1),
  lang: z.string().default("ar"),
  emailSubject: z.string().max(255).optional(),
  emailBody: z.string().optional(),
  active: z.boolean().default(true),
})

export const templateUpdateSchema = templateSchema.partial().extend({
  id: z.string(),
})

// Broadcast schemas
export const broadcastSchema = z.object({
  type: z.enum(["announcement", "system_alert", "event_reminder", "message"]),
  title: z.string().min(1).max(255),
  body: z.string().min(1),
  targetRole: z
    .enum([
      "DEVELOPER",
      "ADMIN",
      "TEACHER",
      "STUDENT",
      "GUARDIAN",
      "ACCOUNTANT",
      "STAFF",
      "USER",
    ])
    .optional(),
  targetClassId: z.string().optional(),
  targetUserIds: z.array(z.string()).default([]),
  scheduledFor: z.coerce.date().optional(),
})

// Settings schemas
export const communicationSettingsSchema = z.object({
  defaultScope: z.enum(["school", "class", "role"]).default("school"),
  defaultPriority: z
    .enum(["low", "normal", "high", "urgent"])
    .default("normal"),
  autoPublish: z.boolean().default(false),
  defaultExpiryDays: z.number().int().min(1).max(365).default(30),
  emailOnPublish: z.boolean().default(true),
  pushNotifications: z.boolean().default(false),
  quietHoursStart: z.string().optional(),
  quietHoursEnd: z.string().optional(),
  digestFrequency: z.enum(["none", "daily", "weekly"]).default("none"),
  readTracking: z.boolean().default(true),
  retentionDays: z.number().int().min(7).max(365).default(90),
  autoArchive: z.boolean().default(true),
  archiveAfterDays: z.number().int().min(1).max(365).default(30),
})

export type TemplateInput = z.infer<typeof templateSchema>
export type TemplateUpdateInput = z.infer<typeof templateUpdateSchema>
export type BroadcastInput = z.infer<typeof broadcastSchema>
export type CommunicationSettingsInput = z.infer<
  typeof communicationSettingsSchema
>
