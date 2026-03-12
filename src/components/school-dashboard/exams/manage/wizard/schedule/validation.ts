// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const scheduleSchema = z.object({
  examDate: z.coerce.date({ message: "Exam date is required" }),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  duration: z.coerce
    .number({ message: "Duration is required" })
    .int()
    .min(1, "Duration must be at least 1 minute")
    .max(480, "Duration cannot exceed 480 minutes"),
  totalMarks: z.coerce
    .number({ message: "Total marks is required" })
    .int()
    .min(1, "Total marks must be at least 1")
    .max(1000, "Total marks cannot exceed 1000"),
  passingMarks: z.coerce
    .number({ message: "Passing marks is required" })
    .int()
    .min(1, "Passing marks must be at least 1"),
  instructions: z.string().optional(),
})

export type ScheduleFormData = z.infer<typeof scheduleSchema>
