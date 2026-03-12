// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const informationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  eventType: z
    .enum([
      "ACADEMIC",
      "SPORTS",
      "CULTURAL",
      "PARENT_MEETING",
      "CELEBRATION",
      "WORKSHOP",
      "OTHER",
    ])
    .optional(),
  organizer: z.string().optional(),
  targetAudience: z.string().optional(),
})

export type InformationFormData = z.infer<typeof informationSchema>
