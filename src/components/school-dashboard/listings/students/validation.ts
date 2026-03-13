// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Single source of truth: composed from wizard step schemas.
// Individual step schemas live in ./wizard/*/validation.ts

import { z } from "zod"

import { contactSchema } from "./wizard/contact/validation"
import { enrollmentSchema } from "./wizard/enrollment/validation"
import { healthSchema } from "./wizard/health/validation"
import { locationSchema } from "./wizard/location/validation"
import { personalSchema } from "./wizard/personal/validation"
import { photoSchema } from "./wizard/photo/validation"
import { previousEducationSchema } from "./wizard/previous-education/validation"

// Composed full schema from wizard steps + system fields
export const studentCreateSchema = photoSchema
  .merge(personalSchema)
  .merge(contactSchema)
  .merge(locationSchema)
  .merge(enrollmentSchema)
  .merge(healthSchema)
  .merge(previousEducationSchema)
  .extend({
    // System fields (not in wizard UI, set programmatically)
    userId: z.string().optional(),
  })

export const studentUpdateSchema = studentCreateSchema.partial().extend({
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
