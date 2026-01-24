import { z } from "zod"

// ============================================================================
// Year Level Validation Schemas
// ============================================================================

export const createYearLevelSchema = z.object({
  levelName: z
    .string()
    .min(1, "Level name is required")
    .max(50, "Level name must be less than 50 characters"),
  levelNameAr: z
    .string()
    .max(50, "Arabic name must be less than 50 characters")
    .optional(),
  levelOrder: z
    .number()
    .int("Level order must be an integer")
    .min(1, "Level order must be at least 1"),
})

export const updateYearLevelSchema = z.object({
  id: z.string().min(1, "Year level ID is required"),
  levelName: z
    .string()
    .min(1, "Level name is required")
    .max(50, "Level name must be less than 50 characters")
    .optional(),
  levelNameAr: z
    .string()
    .max(50, "Arabic name must be less than 50 characters")
    .optional()
    .nullable(),
  levelOrder: z
    .number()
    .int("Level order must be an integer")
    .min(1, "Level order must be at least 1")
    .optional(),
})

export const deleteYearLevelSchema = z.object({
  id: z.string().min(1, "Year level ID is required"),
})

// ============================================================================
// Type Exports
// ============================================================================

export type CreateYearLevelInput = z.infer<typeof createYearLevelSchema>
export type UpdateYearLevelInput = z.infer<typeof updateYearLevelSchema>
export type DeleteYearLevelInput = z.infer<typeof deleteYearLevelSchema>
