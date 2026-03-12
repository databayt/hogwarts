// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const settingsSchema = z.object({
  proctorMode: z.enum(["NONE", "BASIC", "STANDARD", "STRICT"]).default("BASIC"),
  shuffleQuestions: z.boolean().default(true),
  shuffleOptions: z.boolean().default(true),
  maxAttempts: z.coerce
    .number()
    .int()
    .min(1, "At least 1 attempt required")
    .max(5, "Maximum 5 attempts")
    .default(1),
  retakePenalty: z.coerce.number().min(0).max(100).optional(),
  allowLateSubmit: z.boolean().default(false),
  lateSubmitMinutes: z.coerce
    .number()
    .int()
    .min(0, "Cannot be negative")
    .max(60, "Maximum 60 minutes")
    .default(0),
})

export type SettingsFormData = z.infer<typeof settingsSchema>
