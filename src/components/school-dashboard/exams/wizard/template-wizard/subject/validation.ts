// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const subjectSchema = z.object({
  subjectId: z.string().min(1, "At least one subject is required"),
})

export type SubjectFormData = z.infer<typeof subjectSchema>
