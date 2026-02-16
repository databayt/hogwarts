import { z } from "zod"

export const catalogMaterialSchema = z.object({
  catalogSubjectId: z.string().optional().nullable(),
  catalogChapterId: z.string().optional().nullable(),
  catalogLessonId: z.string().optional().nullable(),

  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  lang: z.string().default("ar"),
  type: z
    .enum([
      "TEXTBOOK",
      "SYLLABUS",
      "WORKSHEET",
      "STUDY_GUIDE",
      "REFERENCE",
      "VIDEO_GUIDE",
      "LAB_MANUAL",
      "OTHER",
    ])
    .default("OTHER"),

  fileUrl: z.string().optional().nullable(),
  fileKey: z.string().optional().nullable(),
  fileSize: z.number().int().optional().nullable(),
  mimeType: z.string().optional().nullable(),
  pageCount: z.number().int().optional().nullable(),
  externalUrl: z.string().optional().nullable(),

  tags: z.array(z.string()).default([]),
  status: z
    .enum(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED", "DEPRECATED"])
    .default("DRAFT"),

  approvalStatus: z
    .enum(["PENDING", "APPROVED", "REJECTED"])
    .default("PENDING"),
  visibility: z.enum(["PRIVATE", "SCHOOL", "PUBLIC"]).default("PUBLIC"),
})

export type CatalogMaterialInput = z.infer<typeof catalogMaterialSchema>
