// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const lessonVideoSchema = z.object({
  catalogLessonId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  videoUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional().nullable(),
  durationSeconds: z.number().int().positive().optional().nullable(),
  storageProvider: z.string().optional().nullable(),
  storageKey: z.string().optional().nullable(),
})

export type LessonVideoInput = z.infer<typeof lessonVideoSchema>
