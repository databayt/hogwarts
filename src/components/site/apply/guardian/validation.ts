// Guardian Step Validation

import { z } from "zod"

import { FORM_LIMITS } from "../config.client"

export const guardianSchema = z.object({
  fatherName: z
    .string()
    .min(FORM_LIMITS.NAME_MIN_LENGTH, "Father's name is required")
    .max(FORM_LIMITS.NAME_MAX_LENGTH, "Father's name is too long"),
  fatherOccupation: z
    .string()
    .max(100, "Occupation is too long")
    .optional()
    .or(z.literal("")),
  fatherPhone: z
    .string()
    .max(FORM_LIMITS.PHONE_MAX_LENGTH, "Phone number is too long")
    .optional()
    .or(z.literal("")),
  fatherEmail: z
    .string()
    .email("Invalid email address")
    .max(FORM_LIMITS.EMAIL_MAX_LENGTH, "Email is too long")
    .optional()
    .or(z.literal("")),
  motherName: z
    .string()
    .min(FORM_LIMITS.NAME_MIN_LENGTH, "Mother's name is required")
    .max(FORM_LIMITS.NAME_MAX_LENGTH, "Mother's name is too long"),
  motherOccupation: z
    .string()
    .max(100, "Occupation is too long")
    .optional()
    .or(z.literal("")),
  motherPhone: z
    .string()
    .max(FORM_LIMITS.PHONE_MAX_LENGTH, "Phone number is too long")
    .optional()
    .or(z.literal("")),
  motherEmail: z
    .string()
    .email("Invalid email address")
    .max(FORM_LIMITS.EMAIL_MAX_LENGTH, "Email is too long")
    .optional()
    .or(z.literal("")),
  guardianName: z
    .string()
    .max(FORM_LIMITS.NAME_MAX_LENGTH, "Guardian's name is too long")
    .optional()
    .or(z.literal("")),
  guardianRelation: z.string().optional().or(z.literal("")),
  guardianPhone: z
    .string()
    .max(FORM_LIMITS.PHONE_MAX_LENGTH, "Phone number is too long")
    .optional()
    .or(z.literal("")),
  guardianEmail: z
    .string()
    .email("Invalid email address")
    .max(FORM_LIMITS.EMAIL_MAX_LENGTH, "Email is too long")
    .optional()
    .or(z.literal("")),
})

export type GuardianSchemaType = z.infer<typeof guardianSchema>
