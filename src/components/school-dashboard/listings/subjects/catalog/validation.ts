import { z } from "zod"

export const subjectSelectionSchema = z.object({
  catalogSubjectId: z.string().min(1),
  gradeId: z.string().min(1),
  streamId: z.string().optional().nullable(),
  isRequired: z.boolean().default(true),
  weeklyPeriods: z.number().int().min(0).optional(),
  customName: z.string().optional(),
})

export const contentOverrideSchema = z.object({
  catalogChapterId: z.string().optional().nullable(),
  catalogLessonId: z.string().optional().nullable(),
  isHidden: z.boolean().default(true),
  reason: z.string().optional(),
})

export type SubjectSelectionInput = z.infer<typeof subjectSelectionSchema>
export type ContentOverrideInput = z.infer<typeof contentOverrideSchema>
