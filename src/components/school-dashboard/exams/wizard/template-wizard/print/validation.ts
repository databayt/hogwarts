// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { z } from "zod"

export const printSchema = z.object({
  pageSize: z.enum(["A4", "LETTER"]),
  orientation: z.enum(["portrait", "landscape"]),
  answerSheetType: z.enum(["NONE", "SEPARATE", "BUBBLE"]),
  layout: z.enum(["SINGLE_COLUMN", "TWO_COLUMN", "BOOKLET"]),
  decorations: z.object({
    accentBar: z.object({
      enabled: z.boolean(),
      height: z.number().optional(),
      colorKey: z.enum(["accent", "primary"]).optional(),
    }),
    watermark: z.object({
      enabled: z.boolean(),
      text: z.string().optional(),
      opacity: z.number().optional(),
    }),
    frame: z.object({ enabled: z.boolean() }),
  }),
})

export type PrintFormData = z.infer<typeof printSchema>
