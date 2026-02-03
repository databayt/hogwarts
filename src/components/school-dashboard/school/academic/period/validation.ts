import { z } from "zod"

// Base schema for period
export const periodBaseSchema = z
  .object({
    yearId: z.string().min(1, "Academic year is required"),
    name: z
      .string()
      .min(1, "Period name is required")
      .max(50, "Period name is too long"),
    startTime: z
      .string()
      .regex(
        /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Invalid start time format (HH:MM)"
      ),
    endTime: z
      .string()
      .regex(
        /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Invalid end time format (HH:MM)"
      ),
  })
  .refine(
    (data) => {
      const start = data.startTime.split(":").map(Number)
      const end = data.endTime.split(":").map(Number)
      const startMinutes = start[0] * 60 + start[1]
      const endMinutes = end[0] * 60 + end[1]
      return endMinutes > startMinutes
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  )

// Create schema
export const periodCreateSchema = periodBaseSchema

// Update schema
export const periodUpdateSchema = periodBaseSchema.partial().extend({
  id: z.string().min(1, "Required"),
})

// List schema
export const sortItemSchema = z.object({
  id: z.string(),
  desc: z.boolean().optional(),
})

export const getPeriodsSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(200).default(20),
  yearId: z.string().optional(),
  name: z.string().optional().default(""),
  sort: z.array(sortItemSchema).optional().default([]),
})

// Types
export type PeriodCreateInput = z.infer<typeof periodCreateSchema>
export type PeriodUpdateInput = z.infer<typeof periodUpdateSchema>
export type GetPeriodsInput = z.infer<typeof getPeriodsSchema>
