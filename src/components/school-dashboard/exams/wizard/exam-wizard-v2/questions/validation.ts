// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const questionsSchema = z.object({
  questionIds: z.array(z.string()).min(1, "Select at least one question"),
})

export type QuestionsFormData = z.infer<typeof questionsSchema>
