import { z } from "zod"

// ============================================================================
// Department Validation Schemas
// ============================================================================

export const createDepartmentSchema = z.object({
  departmentName: z
    .string()
    .min(1, "Department name is required")
    .max(100, "Department name must be less than 100 characters"),
  lang: z.enum(["ar", "en"]).default("ar").optional(),
})

export const updateDepartmentSchema = z.object({
  id: z.string().min(1, "Department ID is required"),
  departmentName: z
    .string()
    .min(1, "Department name is required")
    .max(100, "Department name must be less than 100 characters")
    .optional(),
  lang: z.enum(["ar", "en"]).optional(),
})

export const deleteDepartmentSchema = z.object({
  id: z.string().min(1, "Department ID is required"),
})

// ============================================================================
// Type Exports
// ============================================================================

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>
export type DeleteDepartmentInput = z.infer<typeof deleteDepartmentSchema>
