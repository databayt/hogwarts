/**
 * Validation schemas for exam taking and proctoring
 */

import { z } from "zod"

// Submit exam answers schema
export const submitExamAnswersSchema = z.object({
  examId: z.string().cuid(),
  sessionId: z.string().cuid(),
  answers: z.array(
    z.object({
      questionId: z.string().cuid(),
      answerText: z.string().optional(),
      selectedOptionIds: z.array(z.string()).optional(),
    })
  ),
})

export type SubmitExamAnswersInput = z.infer<typeof submitExamAnswersSchema>

// Start exam session schema
export const startExamSessionSchema = z.object({
  examId: z.string().cuid(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  deviceFingerprint: z.string().optional(),
})

export type StartExamSessionInput = z.infer<typeof startExamSessionSchema>

// Auto-save answers schema
export const autoSaveAnswersSchema = z.object({
  sessionId: z.string().cuid(),
  answers: z.array(
    z.object({
      questionId: z.string().cuid(),
      answerText: z.string().optional(),
      selectedOptionIds: z.array(z.string()).optional(),
    })
  ),
  currentQuestionIndex: z.number().int().min(0),
})

export type AutoSaveAnswersInput = z.infer<typeof autoSaveAnswersSchema>

// Report security flag schema
export const reportSecurityFlagSchema = z.object({
  sessionId: z.string().cuid(),
  flag: z.enum([
    "FOCUS_LOST",
    "TAB_SWITCH",
    "COPY_ATTEMPT",
    "TIME_ANOMALY",
    "IP_CHANGE",
    "MULTIPLE_DEVICE",
  ]),
  details: z.string().optional(),
})

export type ReportSecurityFlagInput = z.infer<typeof reportSecurityFlagSchema>

// Update session activity schema
export const updateSessionActivitySchema = z.object({
  sessionId: z.string().cuid(),
})

export type UpdateSessionActivityInput = z.infer<
  typeof updateSessionActivitySchema
>
