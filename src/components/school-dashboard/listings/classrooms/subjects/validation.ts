// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const bulkUpdateSubjectRoomsSchema = z.object({
  assignments: z
    .array(
      z.object({
        classId: z.string().min(1, "Class ID is required"),
        classroomId: z.string().min(1, "Classroom ID is required"),
      })
    )
    .min(1, "At least one assignment is required"),
})

export type BulkUpdateSubjectRoomsInput = z.infer<
  typeof bulkUpdateSubjectRoomsSchema
>
