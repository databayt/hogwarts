// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Academic Step Configuration

import { extractGradeNumber } from "@/lib/grade-utils"

export const ACADEMIC_STEP_CONFIG = {
  id: "academic",
  label: (isRTL: boolean) =>
    isRTL ? "المعلومات الأكاديمية" : "Academic Information",
  description: (isRTL: boolean) =>
    isRTL
      ? "أدخل معلومات التعليم السابق والصف المتقدم إليه"
      : "Enter previous education and applying class information",
}

type OptionDict = Record<string, string>

export const getGradeOptions = (d: OptionDict) => [
  { value: "روضة 1", label: d.kg1 || "KG 1" },
  { value: "روضة 2", label: d.kg2 || "KG 2" },
  { value: "الصف الأول", label: d.grade1 || "Grade 1" },
  { value: "الصف الثاني", label: d.grade2 || "Grade 2" },
  { value: "الصف الثالث", label: d.grade3 || "Grade 3" },
  { value: "الصف الرابع", label: d.grade4 || "Grade 4" },
  { value: "الصف الخامس", label: d.grade5 || "Grade 5" },
  { value: "الصف السادس", label: d.grade6 || "Grade 6" },
  { value: "الصف السابع", label: d.grade7 || "Grade 7" },
  { value: "الصف الثامن", label: d.grade8 || "Grade 8" },
  { value: "الصف التاسع", label: d.grade9 || "Grade 9" },
  { value: "الصف العاشر", label: d.grade10 || "Grade 10" },
  { value: "الصف الحادي عشر", label: d.grade11 || "Grade 11" },
  { value: "الصف الثاني عشر", label: d.grade12 || "Grade 12" },
]

/**
 * Narrow the static grade list to the grades this school actually teaches.
 *
 * The public wizard's picker is a fixed KG1–Grade 12 list; the admin wizard
 * reads the school's own `AcademicGrade` rows. A family at a grades-1–8 school
 * could therefore apply for Grade 12, and enrollment then found no year level
 * to place them in. `gradeNumbers` is the school's set (0 = KG, -1 = nursery,
 * 1–12); an empty set means the school has not defined grades yet, so the
 * full list stays on offer rather than an empty picker.
 */
export const filterGradeOptionsBySchool = <T extends { value: string }>(
  options: T[],
  gradeNumbers: readonly number[] | null | undefined
): T[] => {
  if (!gradeNumbers || gradeNumbers.length === 0) return options
  const have = new Set(gradeNumbers)
  const hasKindergarten = gradeNumbers.some((n) => n <= 0)
  return options.filter((o) => {
    // KG values carry a trailing 1/2 that the numeric resolver would read as
    // Grade 1/2 — recognise them by the label root instead.
    if (o.value.startsWith("روضة")) return hasKindergarten
    const n = extractGradeNumber(o.value)
    return n !== null && have.has(n)
  })
}

export const getStreamOptions = (d: OptionDict) => [
  { value: "science", label: d.science || "Science" },
  { value: "arts", label: d.arts || "Arts" },
  { value: "commerce", label: d.commerce || "Commerce" },
  { value: "general", label: d.general || "General" },
]

export const getPerformanceOptions = (d: OptionDict) => [
  { value: "excellent", label: d.excellent || "Excellent (90%+)" },
  { value: "very-good", label: d["very-good"] || "Very Good (80-89%)" },
  { value: "good", label: d.good || "Good (70-79%)" },
  { value: "average", label: d.average || "Average (60-69%)" },
  {
    value: "below-average",
    label: d["below-average"] || "Below Average (<60%)",
  },
]

export const getLanguageOptions = (d: OptionDict) => [
  { value: "arabic", label: d.arabic || "Arabic" },
  { value: "english", label: d.english || "English" },
  { value: "french", label: d.french || "French" },
  { value: "quran", label: d.quran || "Quran" },
]
