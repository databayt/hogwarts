// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Grade labels — one global key (`g1`…`g12`), country-aware wording.
 *
 *   gradeLabel(7, { lang: "ar", country: "SD" })  → "الأول متوسط"
 *   gradeLabel("g7", { lang: "en", country: "SD" }) → "Grade 7"
 *   gradeLabel(7, { lang: "ar" })                 → "الصف السابع"
 *   gradeRangeLabel([1, 2, 3], { lang: "ar", country: "SD" }) → "الأول – الثالث ابتدائي"
 *
 * Render from `gradeNumber` (or the key), never from a stored prose name.
 */

import { extractGradeNumber } from "@/lib/grade-utils"

import {
  AR_ORDINALS,
  fromGradeKey,
  isGradeKey,
  toGradeKey,
  type GradeKey,
} from "./keys"
import {
  arOrdinalWithin,
  getGradePreset,
  type GradeForm,
  type GradeLang,
} from "./presets"

export {
  AR_ORDINALS,
  GRADE_KEYS,
  fromGradeKey,
  isGradeKey,
  toGradeKey,
  type GradeKey,
} from "./keys"
export { getGradePreset, type GradeForm, type GradeLang } from "./presets"

export interface GradeLabelOptions {
  /** Anything not "ar" renders English. */
  lang?: string | null
  /** School country or curriculum code ("SD", "US", …). */
  country?: string | null
  /** long (default): "الأول متوسط" / "Grade 7"; short: "G7", AR unchanged
   *  for staged presets, bare ordinal ("السابع") for the default preset. */
  form?: GradeForm
}

const langOf = (lang?: string | null): GradeLang =>
  lang === "ar" ? "ar" : "en"

/**
 * Key, number or legacy prose → grade number (KG1 = -1, KG2 = 0, 1–12).
 * Accepts "g7", 7, "7", "Grade 7", "الصف السابع", "الأول متوسط", "روضة 1",
 * "KG 2". Null when nothing matches.
 */
export function parseGrade(input: unknown): number | null {
  if (typeof input === "number") return toGradeKey(input) ? input : null
  if (typeof input !== "string") return null
  const text = input.trim()
  if (!text) return null
  const lower = text.toLowerCase()
  if (isGradeKey(lower)) return fromGradeKey(lower)

  if (/روضة|الروضة|^kg|kindergarten/.test(lower)) {
    if (/2|ثاني|second/.test(lower)) return 0
    if (/1|أول|اول|first/.test(lower)) return -1
    return 0
  }
  if (/حضانة|nursery|pre-?k/.test(lower)) return -2

  return extractGradeNumber(text)
}

export function gradeKeyOf(input: unknown): GradeKey | null {
  const n = parseGrade(input)
  return n === null ? null : toGradeKey(n)
}

export function gradeLabel(
  grade: number | string,
  options: GradeLabelOptions = {}
): string {
  const lang = langOf(options.lang)
  const form = options.form ?? "long"
  const preset = getGradePreset(options.country)
  const n = typeof grade === "number" ? grade : parseGrade(grade)
  if (n === null) return String(grade)

  const key = toGradeKey(n)
  if (key === "pre" || key === "kg1" || key === "kg2")
    return preset.kg[key][lang]
  if (!key) return lang === "ar" ? `الصف ${n}` : `Grade ${n}`

  if (lang === "en") return form === "short" ? `G${n}` : `Grade ${n}`

  const { ordinal, stage } = arOrdinalWithin(preset, n)
  if (stage) return `${ordinal} ${stage.ar}`
  return form === "short" ? ordinal : `الصف ${ordinal}`
}

/**
 * A span of grades as one label: "Grades 1–3", "الأول – الثالث ابتدائي",
 * "الصف الأول – الثالث". Unsorted input is fine; one grade → `gradeLabel`.
 */
export function gradeRangeLabel(
  grades: readonly number[],
  options: GradeLabelOptions = {}
): string {
  const sorted = [...new Set(grades)].sort((a, b) => a - b)
  if (sorted.length === 0) return ""
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  if (first === last) return gradeLabel(first, options)

  const lang = langOf(options.lang)
  if (lang === "en") return `Grades ${first}–${last}`
  if (first < 1) {
    return `${gradeLabel(first, options)} – ${gradeLabel(last, options)}`
  }

  const preset = getGradePreset(options.country)
  const a = arOrdinalWithin(preset, first)
  const b = arOrdinalWithin(preset, last)
  if (a.stage && a.stage === b.stage) {
    return `${a.ordinal} – ${b.ordinal} ${a.stage.ar}`
  }
  if (a.stage || b.stage) {
    return `${gradeLabel(first, options)} – ${gradeLabel(last, options)}`
  }
  return `الصف ${AR_ORDINALS[first] ?? first} – ${AR_ORDINALS[last] ?? last}`
}
