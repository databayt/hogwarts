// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const scheduleSchema = z.object({
  termId: z.string().min(1, "Term is required"),
  startPeriodId: z.string().min(1, "Start period is required"),
  endPeriodId: z.string().min(1, "End period is required"),
  classroomId: z.string().min(1, "Classroom is required"),
  duration: z.coerce.number().int().positive().optional(),
})

export type ScheduleFormData = z.infer<typeof scheduleSchema>

/** Creates a localized schedule schema */
export function createScheduleSchema(v?: {
  termRequired?: string
  startPeriodRequired?: string
  endPeriodRequired?: string
  classroomRequired?: string
}) {
  return z.object({
    termId: z.string().min(1, v?.termRequired || "Term is required"),
    startPeriodId: z
      .string()
      .min(1, v?.startPeriodRequired || "Start period is required"),
    endPeriodId: z
      .string()
      .min(1, v?.endPeriodRequired || "End period is required"),
    classroomId: z
      .string()
      .min(1, v?.classroomRequired || "Classroom is required"),
    duration: z.coerce.number().int().positive().optional(),
  })
}
