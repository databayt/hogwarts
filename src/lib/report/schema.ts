// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

import type { ReportCategory } from "./types"

/**
 * Canonical category list. Source of truth — repo-specific dictionaries
 * translate these keys but cannot add new values.
 */
export const REPORT_CATEGORIES = [
  "visual",
  "broken",
  "data",
  "slow",
  "confusing",
  "auth",
  "i18n",
  "other",
] as const satisfies readonly ReportCategory[]

/**
 * Bounds reasoned in plan §4:
 *  - description only needs to be non-empty (no min/max length constraint).
 *  - pageUrl is checked again later against the repo's host allowlist (HF5).
 *  - viewport regex bounds the existing client capture format (e.g. "1280x720").
 */
export const reportSchema = z.object({
  description: z.string().trim().min(1, "Please describe the issue"),
  pageUrl: z.string().url().max(2048),
  category: z.enum(REPORT_CATEGORIES).default("other"),
  reproSteps: z.string().trim().max(1000).optional(),
  expected: z.string().trim().max(500).optional(),
  actual: z.string().trim().max(500).optional(),
  severityHint: z.enum(["low", "medium", "high", "critical"]).optional(),
  viewport: z
    .string()
    .regex(/^\d{2,5}x\d{2,5}$/, "Viewport must be WxH")
    .optional(),
  direction: z.enum(["ltr", "rtl"]).optional(),
  browser: z.string().max(500).optional(),
  hasScreenshot: z.boolean().default(false),
  captchaToken: z.string().min(1).max(2048).optional(),
})

export type ReportInputParsed = z.infer<typeof reportSchema>
