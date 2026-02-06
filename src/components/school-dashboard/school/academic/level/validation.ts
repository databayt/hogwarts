import { z } from "zod"

// Base schema for year level
export const yearLevelBaseSchema = z.object({
  levelName: z
    .string()
    .min(1, "Level name is required")
    .max(50, "Level name is too long"),
  lang: z.enum(["ar", "en"]).default("ar").optional(),
  levelOrder: z.number().int().min(1, "Level order must be at least 1"),
})

// Create schema
export const yearLevelCreateSchema = yearLevelBaseSchema

// Update schema
export const yearLevelUpdateSchema = yearLevelBaseSchema.partial().extend({
  id: z.string().min(1, "Required"),
})

// List schema
export const sortItemSchema = z.object({
  id: z.string(),
  desc: z.boolean().optional(),
})

export const getYearLevelsSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(200).default(20),
  levelName: z.string().optional().default(""),
  sort: z.array(sortItemSchema).optional().default([]),
})

// Types
export type YearLevelCreateInput = z.infer<typeof yearLevelCreateSchema>
export type YearLevelUpdateInput = z.infer<typeof yearLevelUpdateSchema>
export type GetYearLevelsInput = z.infer<typeof getYearLevelsSchema>
