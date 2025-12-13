import { z } from "zod"

// ============================================================================
// School Year Validation Schemas
// ============================================================================

export const createSchoolYearSchema = z.object({
  yearName: z.string()
    .min(1, "Year name is required")
    .max(50, "Year name must be 50 characters or less")
    .regex(/^\d{4}-\d{4}$/, "Year name must be in format YYYY-YYYY (e.g., 2024-2025)"),
  startDate: z.coerce.date({ message: "Start date is required" }),
  endDate: z.coerce.date({ message: "End date is required" }),
}).refine((data) => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
})

export const updateSchoolYearSchema = z.object({
  id: z.string().min(1, "Year ID is required"),
  yearName: z.string()
    .min(1, "Year name is required")
    .max(50, "Year name must be 50 characters or less")
    .regex(/^\d{4}-\d{4}$/, "Year name must be in format YYYY-YYYY")
    .optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return data.endDate > data.startDate
  }
  return true
}, {
  message: "End date must be after start date",
  path: ["endDate"],
})

export const deleteSchoolYearSchema = z.object({
  id: z.string().min(1, "Year ID is required"),
})

// ============================================================================
// Term Validation Schemas
// ============================================================================

export const createTermSchema = z.object({
  yearId: z.string().min(1, "Academic year is required"),
  termNumber: z.coerce.number()
    .int("Term number must be an integer")
    .min(1, "Term number must be at least 1")
    .max(4, "Term number must be 4 or less"),
  startDate: z.coerce.date({ message: "Start date is required" }),
  endDate: z.coerce.date({ message: "End date is required" }),
}).refine((data) => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
})

export const updateTermSchema = z.object({
  id: z.string().min(1, "Term ID is required"),
  termNumber: z.coerce.number()
    .int()
    .min(1)
    .max(4)
    .optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return data.endDate > data.startDate
  }
  return true
}, {
  message: "End date must be after start date",
  path: ["endDate"],
})

export const deleteTermSchema = z.object({
  id: z.string().min(1, "Term ID is required"),
})

export const setActiveTermSchema = z.object({
  id: z.string().min(1, "Term ID is required"),
})

// ============================================================================
// Period Validation Schemas
// ============================================================================

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/

export const createPeriodSchema = z.object({
  yearId: z.string().min(1, "Academic year is required"),
  name: z.string()
    .min(1, "Period name is required")
    .max(50, "Period name must be 50 characters or less"),
  startTime: z.string()
    .regex(timeRegex, "Start time must be in HH:MM format (e.g., 08:00)"),
  endTime: z.string()
    .regex(timeRegex, "End time must be in HH:MM format (e.g., 08:45)"),
}).refine((data) => {
  const [startHours, startMinutes] = data.startTime.split(":").map(Number)
  const [endHours, endMinutes] = data.endTime.split(":").map(Number)
  const startMinutesTotal = startHours * 60 + startMinutes
  const endMinutesTotal = endHours * 60 + endMinutes
  return endMinutesTotal > startMinutesTotal
}, {
  message: "End time must be after start time",
  path: ["endTime"],
})

export const updatePeriodSchema = z.object({
  id: z.string().min(1, "Period ID is required"),
  name: z.string()
    .min(1)
    .max(50)
    .optional(),
  startTime: z.string()
    .regex(timeRegex, "Start time must be in HH:MM format")
    .optional(),
  endTime: z.string()
    .regex(timeRegex, "End time must be in HH:MM format")
    .optional(),
}).refine((data) => {
  if (data.startTime && data.endTime) {
    const [startHours, startMinutes] = data.startTime.split(":").map(Number)
    const [endHours, endMinutes] = data.endTime.split(":").map(Number)
    const startMinutesTotal = startHours * 60 + startMinutes
    const endMinutesTotal = endHours * 60 + endMinutes
    return endMinutesTotal > startMinutesTotal
  }
  return true
}, {
  message: "End time must be after start time",
  path: ["endTime"],
})

export const deletePeriodSchema = z.object({
  id: z.string().min(1, "Period ID is required"),
})

export const bulkCreatePeriodsSchema = z.object({
  yearId: z.string().min(1, "Academic year is required"),
  periods: z.array(z.object({
    name: z.string().min(1, "Period name is required"),
    startTime: z.string().regex(timeRegex, "Invalid time format"),
    endTime: z.string().regex(timeRegex, "Invalid time format"),
  })).min(1, "At least one period is required"),
})

// ============================================================================
// Type Exports (inferred from schemas)
// ============================================================================

export type CreateSchoolYearInput = z.infer<typeof createSchoolYearSchema>
export type UpdateSchoolYearInput = z.infer<typeof updateSchoolYearSchema>
export type CreateTermInput = z.infer<typeof createTermSchema>
export type UpdateTermInput = z.infer<typeof updateTermSchema>
export type CreatePeriodInput = z.infer<typeof createPeriodSchema>
export type UpdatePeriodInput = z.infer<typeof updatePeriodSchema>
export type BulkCreatePeriodsInput = z.infer<typeof bulkCreatePeriodsSchema>
