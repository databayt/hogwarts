import { z } from "zod"

export const announcementBaseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
  scope: z.enum(["school", "class", "role"]),
  classId: z.string().optional(),
  role: z.string().optional(),
  published: z.boolean(),
}).superRefine((val, ctx) => {
  if (val.scope === "class" && !val.classId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Class is required when scope is class", path: ["classId"] })
  }
  if (val.scope === "role" && !val.role) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Role is required when scope is role", path: ["role"] })
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



