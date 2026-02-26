// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const supportedLanguageSchema = z.enum(["en", "ar"])

export const translateTextSchema = z.object({
  text: z.string(),
  sourceLanguage: supportedLanguageSchema,
})

export const translateFieldsSchema = z.object({
  fields: z.record(z.string(), z.string()),
  sourceLanguage: supportedLanguageSchema,
})
