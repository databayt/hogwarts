// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

import type { ValidationHelper } from "@/components/internationalization/helpers"

/**
 * Build the content-step schema. Pass a ValidationHelper from the rendering
 * component so field errors land in the reader's language; the English
 * fallbacks only apply on the server, where no dictionary is in scope.
 */
export function createContentSchema(v?: ValidationHelper) {
  return z.object({
    title: z.string().min(1, v?.required() || "Title is required"),
    body: z.string().min(1, v?.required() || "Body is required"),
    lang: z.enum(["ar", "en"]).default("ar"),
    priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  })
}

/** Dictionary-free schema for server actions and other non-UI contexts. */
export const contentSchema = createContentSchema()

export type ContentFormData = z.infer<ReturnType<typeof createContentSchema>>
