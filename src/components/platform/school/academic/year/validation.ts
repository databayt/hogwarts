import { z } from "zod"

// Base schema for school year - without refinement for extend compatibility
export const schoolYearBaseSchema = z.object({
  yearName: z.string().min(1, "Year name is required").max(50, "Year name is too long"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
})

// Create schema with refinement
export const schoolYearCreateSchema = schoolYearBaseSchema.refine(
  (data) => data.endDate > data.startDate,
  {
    message: "End date must be after start date",
    path: ["endDate"],
  }
)

// Update schema - extend base first, then refine
export const schoolYearUpdateSchema = schoolYearBaseSchema.extend({
  id: z.string().min(1, "Required"),
}).partial({ yearName: true, startDate: true, endDate: true }).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.endDate > data.startDate
    }
    return true
  },
  {
    message: "End date must be after start date",
    path: ["endDate"],
  }
)

// List schema with sorting and pagination
export const sortItemSchema = z.object({
  id: z.string(),
  desc: z.boolean().optional(),
})

export const getSchoolYearsSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(200).default(20),
  yearName: z.string().optional().default(""),
  sort: z.array(sortItemSchema).optional().default([]),
})

// Types inferred from schemas
export type SchoolYearCreateInput = z.infer<typeof schoolYearCreateSchema>
export type SchoolYearUpdateInput = z.infer<typeof schoolYearUpdateSchema>
export type GetSchoolYearsInput = z.infer<typeof getSchoolYearsSchema>
