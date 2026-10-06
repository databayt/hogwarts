// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Country naming presets for the global grade keys.
 *
 * The key (`g7`) is the same everywhere; a preset decides what a country calls
 * it. Adding a country = one entry in `PRESETS` — nothing else changes.
 *
 * Built so far: `SD` (Abdout, 2026-10-06). Every other country/curriculum
 * renders through `default`, which is the pre-existing wording. Candidates
 * noted for later: SA/KW/QA (same as SD), EG (إعدادي), GB ("Year n+1",
 * Reception), CBSE ("Class n").
 */

import { AR_ORDINALS } from "./keys"

export type GradeLang = "ar" | "en"
export type GradeForm = "long" | "short"

export interface GradeStage {
  start: number
  end: number
  /** Suffix after the in-stage ordinal: "ابتدائي" → "الأول ابتدائي". */
  ar: string
  en: string
}

export interface GradePreset {
  id: string
  /** Empty = one 1–12 sequence ("الصف السابع"). */
  stages: GradeStage[]
  kg: Record<"pre" | "kg1" | "kg2", { ar: string; en: string }>
}

const KG_DEFAULT: GradePreset["kg"] = {
  pre: { ar: "الحضانة", en: "Nursery" },
  kg1: { ar: "روضة أولى", en: "KG 1" },
  kg2: { ar: "روضة ثانية", en: "KG 2" },
}

/**
 * Sudan, 6-3-3. No "الصف" prefix: الأول ابتدائي … الثالث ثانوي.
 * Boundaries match the SD levels in `catalog/academic-config.ts` (asserted
 * by `src/tests/lib/grade-label.test.ts`). English stays "Grade n".
 */
const SD: GradePreset = {
  id: "SD",
  stages: [
    { start: 1, end: 6, ar: "ابتدائي", en: "Primary" },
    { start: 7, end: 9, ar: "متوسط", en: "Intermediate" },
    { start: 10, end: 12, ar: "ثانوي", en: "Secondary" },
  ],
  kg: KG_DEFAULT,
}

const DEFAULT: GradePreset = {
  id: "default",
  stages: [],
  kg: KG_DEFAULT,
}

const PRESETS: Record<string, GradePreset> = { SD }

/**
 * Resolve by country or curriculum code ("SD", "US", "IB-DP", …). Unknown
 * or missing → `default`.
 */
export function getGradePreset(code?: string | null): GradePreset {
  if (!code) return DEFAULT
  return PRESETS[code.toUpperCase()] ?? DEFAULT
}

export function stageOf(
  preset: GradePreset,
  gradeNumber: number
): GradeStage | null {
  return (
    preset.stages.find((s) => gradeNumber >= s.start && gradeNumber <= s.end) ??
    null
  )
}

/** "الأول ابتدائي" (staged) or "السابع" (default) — no "الصف". */
export function arOrdinalWithin(
  preset: GradePreset,
  gradeNumber: number
): { ordinal: string; stage: GradeStage | null } {
  const stage = stageOf(preset, gradeNumber)
  const index = stage ? gradeNumber - stage.start + 1 : gradeNumber
  return { ordinal: AR_ORDINALS[index] ?? String(index), stage }
}
