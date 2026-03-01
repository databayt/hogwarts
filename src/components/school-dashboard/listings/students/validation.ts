// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

import type { Dictionary } from "@/components/internationalization/dictionaries"
import { getValidationMessages } from "@/components/internationalization/helpers"

// ============================================================================
// Schema Factory Functions (i18n-enabled)
// ============================================================================

export function createStudentBaseSchema(dictionary: Dictionary) {
  const v = getValidationMessages(dictionary)

  return z.object({
    givenName: z.string().min(1, { message: v.required() }),
    middleName: z.string().optional(),
    surname: z.string().min(1, { message: v.required() }),
    dateOfBirth: z.string().min(1, { message: v.required() }), // ISO date YYYY-MM-DD
    gender: z.enum(["male", "female"], {
      message: v.required(),
    }),
    enrollmentDate: z.string().optional(), // ISO date YYYY-MM-DD
    userId: z.string().optional(),
    academicGradeId: z.string().optional(),
  })
}

export function createStudentCreateSchema(dictionary: Dictionary) {
  return createStudentBaseSchema(dictionary)
}

export function createStudentUpdateSchema(dictionary: Dictionary) {
  const v = getValidationMessages(dictionary)

  return createStudentBaseSchema(dictionary)
    .partial()
    .extend({
      id: z.string().min(1, { message: v.required() }),
    })
}

// ============================================================================
// Legacy Schemas (for backward compatibility - will be deprecated)
// ============================================================================

export const studentBaseSchema = z.object({
  givenName: z.string().min(1, "Required"),
  middleName: z.string().optional(),
  surname: z.string().min(1, "Required"),
  dateOfBirth: z.string().min(1, "Required"), // ISO date YYYY-MM-DD
  gender: z.enum(["male", "female"]),
  enrollmentDate: z.string().optional(), // ISO date YYYY-MM-DD
  userId: z.string().optional(),
  academicGradeId: z.string().optional(),
})

export const studentCreateSchema = studentBaseSchema

export const studentUpdateSchema = studentBaseSchema.partial().extend({
  id: z.string().min(1, "Required"),
})

export const sortItemSchema = z.object({
  id: z.string(),
  desc: z.boolean().optional(),
})

export const getStudentsSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(200).default(20),
  name: z.string().optional().default(""),
  className: z.string().optional().default(""),
  status: z.string().optional().default(""),
  sort: z.array(sortItemSchema).optional().default([]),
})
