// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

const id = z.string().min(1).max(64)

export const assignTeacherSchema = z.object({
  teacherId: id,
  subjectId: id,
  sectionIds: z.array(id).min(1).max(100),
  /** Go past the teacher's weekly cap after the admin confirmed it. */
  overrideCap: z.boolean().optional(),
})
export type AssignTeacherInput = z.infer<typeof assignTeacherSchema>

export const unassignTeacherSchema = z.object({
  subjectId: id,
  sectionIds: z.array(id).min(1).max(100),
})
export type UnassignTeacherInput = z.infer<typeof unassignTeacherSchema>

export const saveTeacherSubjectsSchema = z.object({
  teacherId: id,
  /** The teacher's full set of subject-in-section pairs after the edit. */
  pairs: z.array(z.object({ subjectId: id, sectionId: id })).max(500),
  overrideCap: z.boolean().optional(),
})
export type SaveTeacherSubjectsInput = z.infer<typeof saveTeacherSubjectsSchema>
