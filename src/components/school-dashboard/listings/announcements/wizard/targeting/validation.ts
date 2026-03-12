// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const targetingSchema = z
  .object({
    scope: z.enum(["school", "class", "role"]),
    classId: z.string().optional(),
    role: z.string().optional(),
    published: z.boolean().default(false),
    scheduledFor: z.coerce.date().optional(),
    expiresAt: z.coerce.date().optional(),
    pinned: z.boolean().optional(),
    featured: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.scope === "class") return !!data.classId
      return true
    },
    { message: "Class is required when scope is class", path: ["classId"] }
  )
  .refine(
    (data) => {
      if (data.scope === "role") return !!data.role
      return true
    },
    { message: "Role is required when scope is role", path: ["role"] }
  )

export type TargetingFormData = z.infer<typeof targetingSchema>
