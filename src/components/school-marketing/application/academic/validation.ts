// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Academic Step Validation

import { z } from "zod"

import type { ValidationHelper } from "@/components/internationalization/helpers"

import { FORM_LIMITS } from "../config.client"

export function createAcademicSchema(v: ValidationHelper) {
  return z.object({
    previousSchool: z
      .string()
      .max(100, v.maxLength(100))
      .optional()
      .or(z.literal("")),
    previousClass: z
      .string()
      .max(50, v.maxLength(50))
      .optional()
      .or(z.literal("")),
    previousMarks: z
      .string()
      .max(20, v.maxLength(20))
      .optional()
      .or(z.literal("")),
    previousPercentage: z
      .string()
      .max(10, v.maxLength(10))
      .optional()
      .or(z.literal("")),
    achievements: z
      .string()
      .max(
        FORM_LIMITS.ACHIEVEMENTS_MAX_LENGTH,
        v.maxLength(FORM_LIMITS.ACHIEVEMENTS_MAX_LENGTH)
      )
      .optional()
      .or(z.literal("")),
    applyingForClass: z.string().min(1, v.required()),
    preferredStream: z.string().optional().or(z.literal("")),
    secondLanguage: z.string().optional().or(z.literal("")),
    thirdLanguage: z.string().optional().or(z.literal("")),
  })
}

// Fallback schema for cases where ValidationHelper is not available
export const academicSchema = z.object({
  previousSchool: z.string().max(100).optional().or(z.literal("")),
  previousClass: z.string().max(50).optional().or(z.literal("")),
  previousMarks: z.string().max(20).optional().or(z.literal("")),
  previousPercentage: z.string().max(10).optional().or(z.literal("")),
  achievements: z
    .string()
    .max(FORM_LIMITS.ACHIEVEMENTS_MAX_LENGTH)
    .optional()
    .or(z.literal("")),
  applyingForClass: z.string().min(1),
  preferredStream: z.string().optional().or(z.literal("")),
  secondLanguage: z.string().optional().or(z.literal("")),
  thirdLanguage: z.string().optional().or(z.literal("")),
})

export type AcademicSchemaType = z.infer<typeof academicSchema>
