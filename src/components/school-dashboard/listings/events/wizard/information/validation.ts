// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

import type { EventValidationMessages } from "../../validation"

export const createInformationSchema = (v?: EventValidationMessages) =>
  z.object({
    title: z.string().min(1, v?.titleRequired),
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

export const informationSchema = createInformationSchema()

export type InformationFormData = z.infer<typeof informationSchema>
