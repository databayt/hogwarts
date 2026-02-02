/**
 * Kiosk Validation Schemas
 *
 * Zod schemas for kiosk operations.
 */
import { z } from "zod"

// Kiosk check-in/out action types
export const kioskActionValues = ["CHECK_IN", "CHECK_OUT"] as const
export type KioskAction = (typeof kioskActionValues)[number]

// Check-in/out method types
export const kioskMethodValues = [
  "BARCODE",
  "QR_CODE",
  "MANUAL",
  "FACE",
] as const
export type KioskMethod = (typeof kioskMethodValues)[number]

// Late arrival reason codes
export const lateReasonCodes = [
  "TRAFFIC",
  "MEDICAL",
  "FAMILY",
  "TRANSPORTATION",
  "WEATHER",
  "OTHER",
] as const
export type LateReasonCode = (typeof lateReasonCodes)[number]

// Early departure reason codes
export const earlyDepartureReasonCodes = [
  "MEDICAL",
  "APPOINTMENT",
  "FAMILY_EMERGENCY",
  "PARENT_PICKUP",
  "SCHOOL_ACTIVITY",
  "OTHER",
] as const
export type EarlyDepartureReasonCode =
  (typeof earlyDepartureReasonCodes)[number]

/**
 * Schema for kiosk check-in/out
 */
export const kioskCheckSchema = z.object({
  kioskId: z.string().min(1, "Kiosk ID is required"),
  identifierValue: z.string().min(1, "Student identifier is required"),
  method: z.enum(kioskMethodValues),
  action: z.enum(kioskActionValues),
  reasonCode: z.string().optional(),
  reasonNote: z.string().optional(),
  photoUrl: z.string().optional(),
})

export type KioskCheckInput = z.infer<typeof kioskCheckSchema>

/**
 * Schema for registering a kiosk
 */
export const registerKioskSchema = z.object({
  kioskId: z.string().min(1, "Kiosk ID is required"),
  kioskName: z.string().min(1, "Kiosk name is required"),
  location: z.string().optional(),
  config: z
    .object({
      cameraEnabled: z.boolean().default(false),
      receiptPrintingEnabled: z.boolean().default(false),
      requireReasonForLate: z.boolean().default(true),
      lateThresholdMinutes: z.number().int().min(0).default(15),
      requireReasonForEarlyDeparture: z.boolean().default(true),
      offlineModeEnabled: z.boolean().default(true),
    })
    .optional(),
})

export type RegisterKioskInput = z.infer<typeof registerKioskSchema>

/**
 * Schema for looking up a student by identifier
 */
export const lookupStudentSchema = z.object({
  identifierValue: z.string().min(1, "Identifier is required"),
  method: z.enum(kioskMethodValues),
})

export type LookupStudentInput = z.infer<typeof lookupStudentSchema>
