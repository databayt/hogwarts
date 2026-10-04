// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

import type { ValidationHelper } from "@/components/internationalization/helpers"

/**
 * Build the targeting-step schema. Pass a ValidationHelper from the rendering
 * component so field errors land in the reader's language; the English
 * fallbacks only apply on the server, where no dictionary is in scope.
 */
export function createTargetingSchema(v?: ValidationHelper) {
  return z
    .object({
      scope: z.enum(["school", "grade", "section", "role"]),
      gradeId: z.string().optional(),
      sectionId: z.string().optional(),
      role: z.string().optional(),
      published: z.boolean().default(false),
      scheduledFor: z.coerce.date().optional(),
      expiresAt: z.coerce.date().optional(),
      pinned: z.boolean().optional(),
      featured: z.boolean().optional(),
    })
    .refine((data) => (data.scope === "grade" ? !!data.gradeId : true), {
      message: v?.required() || "Grade is required when scope is grade",
      path: ["gradeId"],
    })
    .refine((data) => (data.scope === "section" ? !!data.sectionId : true), {
      message: v?.required() || "Section is required when scope is section",
      path: ["sectionId"],
    })
    .refine((data) => (data.scope === "role" ? !!data.role : true), {
      message: v?.required() || "Role is required when scope is role",
      path: ["role"],
    })
}

/** Dictionary-free schema for server actions and other non-UI contexts. */
export const targetingSchema = createTargetingSchema()

export type TargetingFormData = z.infer<
  ReturnType<typeof createTargetingSchema>
>
