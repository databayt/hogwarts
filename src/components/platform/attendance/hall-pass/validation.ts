/**
 * Hall Pass Validation Schemas
 *
 * Zod schemas for hall pass operations.
 */
import { z } from "zod"

// Hall pass destinations
export const hallPassDestinations = [
  "BATHROOM",
  "NURSE",
  "OFFICE",
  "COUNSELOR",
  "LIBRARY",
  "LOCKER",
  "WATER_FOUNTAIN",
  "OTHER",
] as const

export type HallPassDestination = (typeof hallPassDestinations)[number]

// Hall pass statuses
export const hallPassStatuses = [
  "ACTIVE",
  "RETURNED",
  "EXPIRED",
  "CANCELLED",
] as const

export type HallPassStatus = (typeof hallPassStatuses)[number]

/**
 * Schema for creating a hall pass
 */
export const createHallPassSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  classId: z.string().min(1, "Class is required"),
  destination: z.enum(hallPassDestinations),
  destinationNote: z.string().optional(),
  expectedDuration: z.number().int().min(1).max(30).default(5), // 1-30 minutes
  notes: z.string().optional(),
})

export type CreateHallPassInput = z.infer<typeof createHallPassSchema>

/**
 * Schema for returning a hall pass
 */
export const returnHallPassSchema = z.object({
  passId: z.string().min(1, "Pass ID is required"),
  notes: z.string().optional(),
})

export type ReturnHallPassInput = z.infer<typeof returnHallPassSchema>

/**
 * Schema for cancelling a hall pass
 */
export const cancelHallPassSchema = z.object({
  passId: z.string().min(1, "Pass ID is required"),
  reason: z.string().optional(),
})

export type CancelHallPassInput = z.infer<typeof cancelHallPassSchema>
