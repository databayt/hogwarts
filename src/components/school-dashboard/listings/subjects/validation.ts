// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

/**
 * Schema for selecting a catalog subject into a school.
 * Subjects are no longer created manually — they come from the catalog.
 */
export const subjectSelectSchema = z.object({
  catalogSubjectId: z.string().min(1, "Catalog subject is required"),
  gradeId: z.string().min(1, "Grade is required"),
  streamId: z.string().optional(),
  customName: z.string().optional(),
  isRequired: z.boolean().optional(),
  weeklyPeriods: z.number().int().positive().optional(),
})

/**
 * Schema for updating a SchoolSubjectSelection record.
 */
export const subjectUpdateSchema = z.object({
  id: z.string().min(1, "Required"),
  customName: z.string().optional(),
  isRequired: z.boolean().optional(),
  weeklyPeriods: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
})

// Keep for backward compat — re-export as subjectCreateSchema
export const subjectCreateSchema = subjectSelectSchema

export const sortItemSchema = z.object({
  id: z.string(),
  desc: z.boolean().optional(),
})

export const getSubjectsSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(200).default(20),
  name: z.string().optional().default(""),
  department: z.string().optional().default(""),
  sort: z.array(sortItemSchema).optional().default([]),
})
