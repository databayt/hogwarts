// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const detailsSchema = z.object({
  totalPoints: z.coerce
    .number()
    .min(0.01, "Total points must be greater than 0"),
  weight: z.coerce
    .number()
    .min(0.01, "Weight must be greater than 0")
    .max(100, "Weight cannot exceed 100"),
  dueDate: z.coerce.date({ message: "Due date is required" }),
  instructions: z.string().optional(),
})

export type DetailsFormData = z.infer<typeof detailsSchema>
