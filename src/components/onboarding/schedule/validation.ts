// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const scheduleSchema = z.object({
  structureSlug: z.string().min(1, "Please select a timetable structure"),
})

export type ScheduleFormData = z.infer<typeof scheduleSchema>
