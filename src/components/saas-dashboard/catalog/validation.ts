import { z } from "zod"

export const catalogSubjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  lang: z.string().default("ar"),
  description: z.string().optional(),
  department: z.string().min(1, "Department is required"),
  levels: z.array(z.enum(["ELEMENTARY", "MIDDLE", "HIGH"])).min(1),
  country: z.string().default("SD"),
  system: z.string().default("national"),
  imageKey: z.string().optional(),
  color: z.string().optional(),
  status: z
    .enum(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED", "DEPRECATED"])
    .default("DRAFT"),
  gradeRange: z.string().optional(),
  sortOrder: z.number().int().default(0),
})

export const catalogChapterSchema = z.object({
  subjectId: z.string().min(1),
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  lang: z.string().default("ar"),
  description: z.string().optional(),
  sequenceOrder: z.number().int().min(0),
  imageKey: z.string().optional(),
  color: z.string().optional(),
  status: z
    .enum(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED", "DEPRECATED"])
    .default("DRAFT"),
})

export const catalogLessonSchema = z.object({
  chapterId: z.string().min(1),
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  lang: z.string().default("ar"),
  description: z.string().optional(),
  sequenceOrder: z.number().int().min(0),
  durationMinutes: z.number().int().optional(),
  objectives: z.string().optional(),
  status: z
    .enum(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED", "DEPRECATED"])
    .default("DRAFT"),
})

export type CatalogSubjectInput = z.infer<typeof catalogSubjectSchema>
export type CatalogChapterInput = z.infer<typeof catalogChapterSchema>
export type CatalogLessonInput = z.infer<typeof catalogLessonSchema>
