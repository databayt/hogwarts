import { z } from "zod"

// Base schema for score range (grading scale) - without refinement
export const scoreRangeBaseSchema = z.object({
  minScore: z
    .number()
    .min(0, "Minimum score must be at least 0")
    .max(100, "Maximum score is 100"),
  maxScore: z
    .number()
    .min(0, "Minimum score must be at least 0")
    .max(100, "Maximum score is 100"),
  grade: z.string().min(1, "Grade is required").max(10, "Grade is too long"),
})

// Create schema with refinement
export const scoreRangeCreateSchema = scoreRangeBaseSchema.refine(
  (data) => data.maxScore >= data.minScore,
  {
    message: "Maximum score must be greater than or equal to minimum score",
    path: ["maxScore"],
  }
)

// Update schema - extend base first, then refine
export const scoreRangeUpdateSchema = scoreRangeBaseSchema
  .extend({
    id: z.string().min(1, "Required"),
  })
  .partial({ minScore: true, maxScore: true, grade: true })
  .refine(
    (data) => {
      if (data.maxScore !== undefined && data.minScore !== undefined) {
        return data.maxScore >= data.minScore
      }
      return true
    },
    {
      message: "Maximum score must be greater than or equal to minimum score",
      path: ["maxScore"],
    }
  )

// List schema
export const sortItemSchema = z.object({
  id: z.string(),
  desc: z.boolean().optional(),
})

export const getScoreRangesSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(200).default(20),
  grade: z.string().optional().default(""),
  sort: z.array(sortItemSchema).optional().default([]),
})

// Types
export type ScoreRangeCreateInput = z.infer<typeof scoreRangeCreateSchema>
export type ScoreRangeUpdateInput = z.infer<typeof scoreRangeUpdateSchema>
export type GetScoreRangesInput = z.infer<typeof getScoreRangesSchema>
