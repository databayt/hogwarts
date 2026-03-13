// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { z } from "zod"

export const coverSchema = z.object({
  variant: z.string().min(1),
})

export type CoverFormData = z.infer<typeof coverSchema>
