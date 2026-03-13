// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const templateSelectSchema = z.object({
  templateId: z.string().min(1, "Select a template"),
})

export type TemplateSelectFormData = z.infer<typeof templateSelectSchema>
