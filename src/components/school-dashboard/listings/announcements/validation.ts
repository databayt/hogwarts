import { z } from "zod"

// Single-language announcement schema
// Content stored in one language with a `lang` field
export const announcementBaseSchema = z
  .object({
    title: z.string().optional(),
    body: z.string().optional(),
    lang: z.enum(["ar", "en"]).default("ar"),
    scope: z.enum(["school", "class", "role"]),
    classId: z.string().optional(),
    role: z.string().optional(),
    published: z.boolean(),
    priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
    scheduledFor: z.string().datetime().optional().or(z.literal("")),
    expiresAt: z.string().datetime().optional().or(z.literal("")),
    pinned: z.boolean().optional(),
    featured: z.boolean().optional(),
  })
  .superRefine((val, ctx) => {
    // Title is required
    if (!val.title) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Title is required",
        path: ["title"],
      })
    }
    // Body is required
    if (!val.body) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Body is required",
        path: ["body"],
      })
    }
    if (val.scope === "class" && !val.classId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Class is required when scope is class",
        path: ["classId"],
      })
    }
    if (val.scope === "role" && !val.role) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Role is required when scope is role",
        path: ["role"],
      })
    }
    // Validate scheduled date is in the future
    if (
      val.scheduledFor &&
      val.scheduledFor !== "" &&
      val.published === false
    ) {
      const scheduledDate = new Date(val.scheduledFor)
      if (scheduledDate < new Date()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Scheduled date must be in the future",
          path: ["scheduledFor"],
        })
      }
    }
    // Validate expiration is after creation
    if (val.expiresAt && val.expiresAt !== "") {
      const expiresDate = new Date(val.expiresAt)
      if (val.scheduledFor && val.scheduledFor !== "") {
        const scheduledDate = new Date(val.scheduledFor)
        if (expiresDate <= scheduledDate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Expiration date must be after scheduled date",
            path: ["expiresAt"],
          })
        }
      }
    }
  })

export const announcementCreateSchema = announcementBaseSchema

// Type for form values (use with react-hook-form)
export type AnnouncementFormValues = z.infer<typeof announcementCreateSchema>

// Alias for compatibility
export type AnnouncementFormData = AnnouncementFormValues

export const announcementUpdateSchema = announcementBaseSchema
  .partial()
  .extend({
    id: z.string().min(1, "Required"),
  })

export const sortItemSchema = z.object({
  id: z.string(),
  desc: z.boolean().optional(),
})

export const getAnnouncementsSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(200).default(20),
  title: z.string().optional().default(""), // Searches title field
  scope: z.string().optional().default(""),
  published: z.string().optional().default(""),
  sort: z.array(sortItemSchema).optional().default([]),
})

// ============================================================================
// Announcement Config Schema
// ============================================================================

export const announcementConfigSchema = z.object({
  // Publishing Defaults
  defaultScope: z.enum(["school", "class", "role"]),
  defaultPriority: z.enum(["low", "normal", "high", "urgent"]),
  autoPublish: z.boolean(),
  defaultExpiryDays: z.number().int().min(1).max(365),

  // Notifications
  emailOnPublish: z.boolean(),
  pushNotifications: z.boolean(),
  quietHoursStart: z.string().nullable(),
  quietHoursEnd: z.string().nullable(),
  digestFrequency: z.enum(["none", "daily", "weekly"]),

  // Templates
  defaultTemplateId: z.string().nullable().optional(),
  allowCustomTemplates: z.boolean(),

  // Tracking & Retention
  readTracking: z.boolean(),
  retentionDays: z.number().int().min(1).max(365),
  autoArchive: z.boolean(),
  archiveAfterDays: z.number().int().min(1).max(365),
})

export type AnnouncementConfigFormValues = z.infer<
  typeof announcementConfigSchema
>
