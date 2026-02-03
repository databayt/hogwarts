/**
 * Absence Intention Validation Schemas
 *
 * Schemas for pre-absence notification (student/parent notification of planned absences)
 */
import { z } from "zod"

// Reuse ExcuseReason enum values
export const excuseReasonValues = [
  "MEDICAL",
  "FAMILY_EMERGENCY",
  "RELIGIOUS",
  "SCHOOL_ACTIVITY",
  "TRANSPORTATION",
  "WEATHER",
  "OTHER",
] as const

export type ExcuseReasonType = (typeof excuseReasonValues)[number]

// Intention status values
export const intentionStatusValues = [
  "PENDING",
  "APPROVED",
  "REJECTED",
] as const
export type IntentionStatusType = (typeof intentionStatusValues)[number]

/**
 * Schema for submitting a new absence intention
 */
export const submitIntentionSchema = z
  .object({
    studentId: z.string().min(1, "Student is required"),
    dateFrom: z.coerce.date(),
    dateTo: z.coerce.date(),
    reason: z.enum(excuseReasonValues),
    description: z.string().optional(),
    attachments: z.array(z.string().url()).optional().default([]),
    notifyTeachers: z.boolean().optional().default(true),
    notifyGuardians: z.boolean().optional().default(true),
  })
  .refine((data) => data.dateTo >= data.dateFrom, {
    message: "End date must be on or after start date",
    path: ["dateTo"],
  })
  .refine(
    (data) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return data.dateFrom >= today
    },
    {
      message: "Start date must be today or in the future",
      path: ["dateFrom"],
    }
  )

export type SubmitIntentionInput = z.infer<typeof submitIntentionSchema>

/**
 * Schema for reviewing an absence intention
 */
export const reviewIntentionSchema = z.object({
  intentionId: z.string().min(1, "Intention ID is required"),
  status: z.enum(["APPROVED", "REJECTED"]),
  reviewNotes: z.string().optional(),
})

export type ReviewIntentionInput = z.infer<typeof reviewIntentionSchema>

/**
 * Schema for filtering intentions
 */
export const filterIntentionsSchema = z.object({
  status: z
    .enum([...intentionStatusValues, "ALL"])
    .optional()
    .default("ALL"),
  studentId: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  reason: z.enum(excuseReasonValues).optional(),
})

export type FilterIntentionsInput = z.infer<typeof filterIntentionsSchema>
