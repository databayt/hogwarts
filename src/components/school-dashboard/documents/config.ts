// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { DocumentTemplateCategory } from "@prisma/client"

/**
 * Plain constants for the fill engine. Kept OUT of `generate.ts` because that
 * file is `"use server"` — every export there must be an async function, so a
 * bare `const` would be rejected at build time.
 */

/**
 * Upper bound on one bulk fill call. Every filled `.docx` is held in memory,
 * zipped, then base64'd into the action response — roughly 1.4x the raw bytes
 * on the wire — so a whole 900-student term in one call is tens of megabytes
 * and dies. Callers page through the cohort in slices of this size and download
 * a part per slice. Raising it without measuring a REAL school template (a logo
 * puts a template past 100KB) is how it breaks.
 */
export const BULK_MAX_ENTITIES = 50

/**
 * Categories that have a resolver, and therefore a starter `.docx` worth
 * offering. Lives here rather than beside the builder so a `"use client"`
 * component can ask "is there a starter for this?" without pulling PizZip and
 * the OOXML writer into the browser bundle.
 */
export const STARTER_CATEGORIES: DocumentTemplateCategory[] = [
  "EXAM_PAPER",
  "CERTIFICATE",
  "REPORT_CARD",
]
