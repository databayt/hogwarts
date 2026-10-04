// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

/**
 * What a piece of work (an exam, an assignment) is set for: a grade, one of
 * its sections or the whole grade (`sectionId: null`), and a subject. The
 * replacement for picking a "class".
 */
export const teachingScopeFields = {
  gradeId: z.string().min(1),
  sectionId: z.string().min(1).nullable(),
  subjectId: z.string().min(1),
}

export const teachingScopeSchema = z.object(teachingScopeFields)

export type TeachingScopeValue = z.infer<typeof teachingScopeSchema>

export const EMPTY_TEACHING_SCOPE: TeachingScopeValue = {
  gradeId: "",
  sectionId: null,
  subjectId: "",
}
