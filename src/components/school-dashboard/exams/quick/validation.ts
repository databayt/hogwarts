import { z } from "zod"

export const quickAssessmentCreateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  classId: z.string().min(1, "Class is required"),
  subjectId: z.string().min(1, "Subject is required"),
  type: z.enum(["EXIT_TICKET", "POLL", "WARM_UP", "CHECK_IN"]),
  questionIds: z.array(z.string()).min(1, "At least one question is required"),
  duration: z.number().int().min(1).max(60).optional().default(5),
  isAnonymous: z.boolean().optional().default(false),
  showResults: z.boolean().optional().default(true),
})

export const quickAssessmentUpdateSchema = quickAssessmentCreateSchema
  .partial()
  .extend({
    id: z.string().min(1, "ID is required"),
  })

export const submitQuickResponseSchema = z.object({
  assessmentId: z.string().min(1, "Assessment ID is required"),
  responses: z.array(
    z.object({
      questionId: z.string(),
      answer: z.unknown(),
      isCorrect: z.boolean().optional(),
    })
  ),
})
