// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const contentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
  lang: z.enum(["ar", "en"]).default("ar"),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
})

export type ContentFormData = z.infer<typeof contentSchema>
