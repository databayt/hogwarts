// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

import { getLessonsSchema } from "./validation"

export const lessonsSearchParams = z.object({
  page: z.coerce.number().default(1),
  perPage: z.coerce.number().default(20),
  title: z.string().optional(),
  classId: z.string().optional(),
  status: z.string().optional(),
  lessonDate: z.string().optional(),
  sort: z
    .array(z.object({ id: z.string(), desc: z.coerce.boolean() }))
    .optional(),
})

export type LessonsSearchParams = z.infer<typeof lessonsSearchParams>
