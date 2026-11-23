// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

import {
  defaultAssignmentValidationMessages,
  type AssignmentValidationMessages,
} from "./validation-messages"

const ASSIGNMENT_TYPES = [
  "HOMEWORK",
  "QUIZ",
  "TEST",
  "MIDTERM",
  "FINAL_EXAM",
  "PROJECT",
  "LAB_REPORT",
  "ESSAY",
  "PRESENTATION",
] as const

/**
 * Schema builders — pass `assignments.validation` from the dictionary so the
 * form shows the reader's language (mirrors `createLoginSchema`). The plain
 * exports below are the same schemas in the default language for server code.
 */
export function createAssignmentBaseSchema(m: AssignmentValidationMessages) {
  return z.object({
    title: z.string().min(1, m.titleRequired),
    description: z.string().optional(),
    classId: z.string().min(1, m.classRequired),
    type: z.enum(ASSIGNMENT_TYPES),
    totalPoints: z.number().min(0.01, m.totalPointsMin),
    weight: z.number().min(0.01, m.weightMin).max(100, m.weightMax),
    dueDate: z.date({ message: m.dueDateRequired }),
    instructions: z.string().optional(),
  })
}

export function createAssignmentCreateSchema(m: AssignmentValidationMessages) {
  return createAssignmentBaseSchema(m)
}

export function createAssignmentUpdateSchema(m: AssignmentValidationMessages) {
  return createAssignmentBaseSchema(m)
    .partial()
    .extend({ id: z.string().min(1, m.idRequired) })
}

export const assignmentBaseSchema = createAssignmentBaseSchema(
  defaultAssignmentValidationMessages
)

export const assignmentCreateSchema = assignmentBaseSchema

export const assignmentUpdateSchema = createAssignmentUpdateSchema(
  defaultAssignmentValidationMessages
)

export const sortItemSchema = z.object({
  id: z.string(),
  desc: z.boolean().optional(),
})

export const getAssignmentsSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(200).default(20),
  title: z.string().optional().default(""),
  type: z.string().optional().default(""),
  sort: z.array(sortItemSchema).optional().default([]),
})
