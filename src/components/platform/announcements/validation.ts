import { z } from "zod"

export const announcementBaseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
  scope: z.enum(["school", "class", "role"]),
  classId: z.string().optional(),
  role: z.string().optional(),
  published: z.boolean(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  scheduledFor: z.string().datetime().optional().or(z.literal("")),
  expiresAt: z.string().datetime().optional().or(z.literal("")),
  pinned: z.boolean().optional(),
  featured: z.boolean().optional(),
}).superRefine((val, ctx) => {
  if (val.scope === "class" && !val.classId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Class is required when scope is class", path: ["classId"] })
  }
  if (val.scope === "role" && !val.role) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Role is required when scope is role", path: ["role"] })
  }
  // Validate scheduled date is in the future
  if (val.scheduledFor && val.scheduledFor !== "" && val.published === false) {
    const scheduledDate = new Date(val.scheduledFor);
    if (scheduledDate < new Date()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Scheduled date must be in the future", path: ["scheduledFor"] })
    }
  }
  // Validate expiration is after creation
  if (val.expiresAt && val.expiresAt !== "") {
    const expiresDate = new Date(val.expiresAt);
    if (val.scheduledFor && val.scheduledFor !== "") {
      const scheduledDate = new Date(val.scheduledFor);
      if (expiresDate <= scheduledDate) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Expiration date must be after scheduled date", path: ["expiresAt"] })
      }
    }
  }
})

export const announcementCreateSchema = announcementBaseSchema

export const announcementUpdateSchema = announcementBaseSchema.partial().extend({
  id: z.string().min(1, "Required"),
})

export const sortItemSchema = z.object({ id: z.string(), desc: z.boolean().optional() })

export const getAnnouncementsSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(200).default(20),
  title: z.string().optional().default(""),
  scope: z.string().optional().default(""),
  published: z.string().optional().default(""),
  sort: z.array(sortItemSchema).optional().default([]),
})



