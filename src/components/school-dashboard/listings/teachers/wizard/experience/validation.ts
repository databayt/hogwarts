// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const experienceItemSchema = z
  .object({
    institution: z.string().min(1, "Institution is required"),
    position: z.string().min(1, "Position is required"),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    isCurrent: z.boolean().default(false),
    description: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.isCurrent && data.endDate) {
        return data.startDate < data.endDate
      }
      return true
    },
    {
      message: "Start date must be before end date",
      path: ["endDate"],
    }
  )

export const experiencesSchema = z.object({
  experiences: z.array(experienceItemSchema).default([]),
})

export type ExperienceItemFormData = z.infer<typeof experienceItemSchema>
export type ExperiencesFormData = z.infer<typeof experiencesSchema>
