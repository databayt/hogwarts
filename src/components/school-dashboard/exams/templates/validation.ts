// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Exam Paper Templates - Validation Schemas
 * Zod schemas for theme, config, and preset validation
 */

import { z } from "zod"

export const paperThemeSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  mutedColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  surfaceColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  fontFamily: z.string(),
  fontSize: z.object({
    title: z.number().min(8).max(48),
    subtitle: z.number().min(8).max(36),
    heading: z.number().min(8).max(24),
    body: z.number().min(6).max(18),
    small: z.number().min(5).max(14),
    tiny: z.number().min(4).max(12),
  }),
  questionGap: z.number().min(0).max(100),
  sectionGap: z.number().min(0).max(100),
  optionGap: z.number().min(0).max(50),
  pageMargin: z.number().min(10).max(100),
  locale: z.enum(["en", "ar"]),
  isRTL: z.boolean(),
  numberStyle: z.enum(["plain", "circle", "square"]),
  borderStyle: z.enum(["solid", "dashed", "double"]),
})

export const regionPresetSchema = z.object({
  id: z.string(),
  name: z.object({ en: z.string(), ar: z.string() }),
  description: z.object({ en: z.string(), ar: z.string() }),
  baseTemplate: z.enum(["CLASSIC", "MODERN", "FORMAL", "CUSTOM"]),
  themeOverrides: paperThemeSchema.partial(),
  features: z.object({
    watermark: z.boolean(),
    ministryHeader: z.boolean(),
    disclaimer: z.boolean(),
    bubbleSheet: z.boolean(),
    seatNumber: z.boolean(),
  }),
  defaultLocale: z.enum(["en", "ar"]),
  countries: z.array(z.string()),
})

export type PaperThemeInput = z.infer<typeof paperThemeSchema>
export type RegionPresetInput = z.infer<typeof regionPresetSchema>
