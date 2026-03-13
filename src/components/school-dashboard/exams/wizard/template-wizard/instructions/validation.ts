// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { z } from "zod"

export const instructionsSchema = z.object({
  variant: z.string().min(1),
})

export type InstructionsFormData = z.infer<typeof instructionsSchema>
