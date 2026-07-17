// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

import type { EventValidationMessages } from "../../validation"

export const createScheduleSchema = (v?: EventValidationMessages) =>
  z.object({
    eventDate: z.coerce.date({ message: v?.eventDateRequired }),
    startTime: z.string().min(1, v?.startTimeRequired),
    endTime: z.string().min(1, v?.endTimeRequired),
    location: z.string().optional(),
  })

export const scheduleSchema = createScheduleSchema()

export type ScheduleFormData = z.infer<typeof scheduleSchema>
