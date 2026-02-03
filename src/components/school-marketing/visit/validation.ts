import { z } from "zod"

/**
 * Visit Scheduling Validation Schemas
 */

// Step 1: Date Selection
export const dateStepSchema = z.object({
  date: z.string().min(1, "Please select a date"),
})

// Step 2: Time Selection
export const timeStepSchema = z.object({
  startTime: z.string().min(1, "Please select a time slot"),
  endTime: z.string().optional(),
})

// Step 3: Visitor Information
export const infoStepSchema = z.object({
  visitorName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .optional()
    .or(z.literal("")),
  purpose: z.string().min(1, "Please select a visit purpose"),
  visitors: z
    .number()
    .min(1, "At least 1 visitor required")
    .max(10, "Maximum 10 visitors per booking"),
  notes: z
    .string()
    .max(500, "Notes must be less than 500 characters")
    .optional(),
})

// Step 4: Confirmation (no validation, just review)
export const confirmStepSchema = z.object({})

// Combined schema for all steps
export const visitFormSchema = z.object({
  ...dateStepSchema.shape,
  ...timeStepSchema.shape,
  ...infoStepSchema.shape,
})

export type VisitFormData = z.infer<typeof visitFormSchema>
export type DateStepData = z.infer<typeof dateStepSchema>
export type TimeStepData = z.infer<typeof timeStepSchema>
export type InfoStepData = z.infer<typeof infoStepSchema>
