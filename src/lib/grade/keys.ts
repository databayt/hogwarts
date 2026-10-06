// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The global grade key. One string per school year, the same in every
 * country: `pre`, `kg1`, `kg2`, `g1` … `g12`. Labels are a presentation
 * concern (see `presets.ts`); the key and its number never change.
 *
 * Numbers match `AcademicGrade.gradeNumber`: KG1 = -1, KG2 = 0, Grade n = n
 * (the King Fahad seed already stores KG this way). `g12` is also the catalog
 * CDN path segment (`catalog/sd/g12/...`).
 */

export const GRADE_KEYS = [
  "pre",
  "kg1",
  "kg2",
  "g1",
  "g2",
  "g3",
  "g4",
  "g5",
  "g6",
  "g7",
  "g8",
  "g9",
  "g10",
  "g11",
  "g12",
] as const

export type GradeKey = (typeof GRADE_KEYS)[number]

const NUMBER_BY_KEY: Record<GradeKey, number> = {
  pre: -2,
  kg1: -1,
  kg2: 0,
  g1: 1,
  g2: 2,
  g3: 3,
  g4: 4,
  g5: 5,
  g6: 6,
  g7: 7,
  g8: 8,
  g9: 9,
  g10: 10,
  g11: 11,
  g12: 12,
}

export function isGradeKey(value: unknown): value is GradeKey {
  return typeof value === "string" && value in NUMBER_BY_KEY
}

export function fromGradeKey(key: GradeKey): number {
  return NUMBER_BY_KEY[key]
}

export function toGradeKey(gradeNumber: number): GradeKey | null {
  if (gradeNumber === -2) return "pre"
  if (gradeNumber === -1) return "kg1"
  if (gradeNumber === 0) return "kg2"
  if (Number.isInteger(gradeNumber) && gradeNumber >= 1 && gradeNumber <= 12)
    return `g${gradeNumber}` as GradeKey
  return null
}

/** Masculine Arabic ordinals, index = grade within its stage (1-based). */
export const AR_ORDINALS = [
  "",
  "الأول",
  "الثاني",
  "الثالث",
  "الرابع",
  "الخامس",
  "السادس",
  "السابع",
  "الثامن",
  "التاسع",
  "العاشر",
  "الحادي عشر",
  "الثاني عشر",
] as const
