import { z } from "zod"

export const catalogQuestionSchema = z.object({
  catalogSubjectId: z.string().optional().nullable(),
  catalogChapterId: z.string().optional().nullable(),
  catalogLessonId: z.string().optional().nullable(),

  questionText: z.string().min(1, "Question text is required"),
  questionType: z.enum([
    "MULTIPLE_CHOICE",
    "TRUE_FALSE",
    "SHORT_ANSWER",
    "ESSAY",
    "FILL_BLANK",
  ]),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  bloomLevel: z.enum([
    "REMEMBER",
    "UNDERSTAND",
    "APPLY",
    "ANALYZE",
    "EVALUATE",
    "CREATE",
  ]),
  points: z.number().min(0).default(1),

  options: z.any().optional().nullable(),
  sampleAnswer: z.string().optional().nullable(),
  explanation: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),

  approvalStatus: z
    .enum(["PENDING", "APPROVED", "REJECTED"])
    .default("PENDING"),
  visibility: z.enum(["PRIVATE", "SCHOOL", "PUBLIC"]).default("PUBLIC"),
  status: z
    .enum(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED", "DEPRECATED"])
    .default("DRAFT"),
})

export type CatalogQuestionInput = z.infer<typeof catalogQuestionSchema>
