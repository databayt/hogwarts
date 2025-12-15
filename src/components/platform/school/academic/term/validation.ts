import { z } from "zod"

// Base schema for term - without refinement for extend compatibility
export const termBaseSchema = z.object({
  yearId: z.string().min(1, "Academic year is required"),
  termNumber: z.coerce
    .number()
    .int()
    .min(1, "Term number must be at least 1")
    .max(4, "Term number cannot exceed 4"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  isActive: z.coerce.boolean().default(false),
})

// Create schema with refinement
export const termCreateSchema = termBaseSchema.refine(
  (data) => data.endDate > data.startDate,
  {
    message: "End date must be after start date",
    path: ["endDate"],
  }
)

// Update schema - extend base first, then refine
export const termUpdateSchema = termBaseSchema
  .extend({
    id: z.string().min(1, "Required"),
  })
  .partial({
    yearId: true,
    termNumber: true,
    startDate: true,
    endDate: true,
    isActive: true,
  })
  .refine(
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

export const getTermsSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(200).default(20),
  yearId: z.string().optional(),
  sort: z.array(sortItemSchema).optional().default([]),
})

// Types inferred from schemas
export type TermCreateInput = z.infer<typeof termCreateSchema>
export type TermUpdateInput = z.infer<typeof termUpdateSchema>
export type GetTermsInput = z.infer<typeof getTermsSchema>
