// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const selectionSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  classId: z.string().min(1, "Class is required"),
  assignmentId: z.string().optional(),
  examId: z.string().optional(),
  subjectId: z.string().optional(),
})

export type SelectionFormData = z.infer<typeof selectionSchema>
