// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

import type { EventValidationMessages } from "../../validation"

export const createSettingsSchema = (v?: EventValidationMessages) =>
  z.object({
    maxAttendees: z.coerce.number().min(1, v?.mustBeAtLeast1).optional(),
    isPublic: z.boolean(),
    registrationRequired: z.boolean(),
    notes: z.string().optional(),
  })

export const settingsSchema = createSettingsSchema()

export type SettingsFormData = z.infer<typeof settingsSchema>
