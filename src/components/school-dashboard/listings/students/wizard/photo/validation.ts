// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const photoSchema = z.object({
  profilePhotoUrl: z.string().optional(),
})

export type PhotoFormData = z.infer<typeof photoSchema>
