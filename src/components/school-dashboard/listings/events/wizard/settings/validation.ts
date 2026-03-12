// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const settingsSchema = z.object({
  maxAttendees: z.coerce.number().min(1, "Must be at least 1").optional(),
  isPublic: z.boolean(),
  registrationRequired: z.boolean(),
  notes: z.string().optional(),
})

export type SettingsFormData = z.infer<typeof settingsSchema>
