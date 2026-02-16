import { z } from "zod"

export const catalogAssignmentSchema = z.object({
  catalogSubjectId: z.string().optional().nullable(),
  catalogChapterId: z.string().optional().nullable(),
  catalogLessonId: z.string().optional().nullable(),

  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  lang: z.string().default("ar"),
  instructions: z.string().optional().nullable(),
  rubric: z.string().optional().nullable(),

  totalPoints: z.number().min(0).optional().nullable(),
  estimatedTime: z.number().int().min(0).optional().nullable(),
  assignmentType: z.string().optional().nullable(),

  tags: z.array(z.string()).default([]),
  status: z
    .enum(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED", "DEPRECATED"])
    .default("DRAFT"),

  approvalStatus: z
    .enum(["PENDING", "APPROVED", "REJECTED"])
    .default("PENDING"),
  visibility: z.enum(["PRIVATE", "SCHOOL", "PUBLIC"]).default("PUBLIC"),
})

export type CatalogAssignmentInput = z.infer<typeof catalogAssignmentSchema>
