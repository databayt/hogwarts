// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const scheduleSchema = z.object({
  eventDate: z.coerce.date({ message: "Event date is required" }),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  location: z.string().optional(),
})

export type ScheduleFormData = z.infer<typeof scheduleSchema>
