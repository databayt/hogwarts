// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// A class's school STAGE — kg · primary · intermediate · secondary — decided
// from the academic grade of its section. Pure, so the supervisors' settings,
// the no-show alert and the cover page all ask the one rule.
//
// The school's own words win: a grade called «الصف الأول الثانوي» is secondary
// whatever number it carries. Only then the numbers: a grade at or below 0 is
// the kindergarten, then the level's enum (SchoolLevel), then the usual
// Gulf/Sudan ladder 1–6 · 7–9 · 10–12.

export const LIVE_STAGES = [
  "kg",
  "primary",
  "intermediate",
  "secondary",
] as const
export type LiveStage = (typeof LIVE_STAGES)[number]

export function isLiveStage(v: unknown): v is LiveStage {
  return typeof v === "string" && (LIVE_STAGES as readonly string[]).includes(v)
}

export type StageInput = {
  /** AcademicGrade.name — «الصف الثالث الابتدائي» */
  gradeName?: string | null
  gradeNumber?: number | null
  /** AcademicLevel.name — «المرحلة المتوسطة» */
  levelName?: string | null
  /** AcademicLevel.level — the SchoolLevel enum. */
  level?: "ELEMENTARY" | "MIDDLE" | "HIGH" | string | null
  /** YearLevel.levelName, when the grade is linked to one. */
  yearLevelName?: string | null
}

// Order matters: «الأول الثانوي» also holds «الأول», and a «روضة» name must not
// fall through to the ladder. Secondary and intermediate are tested before
// primary because their names are the more specific.
const NAME_RULES: Array<[LiveStage, RegExp]> = [
  [
    "kg",
    /روض|تمهيدي|حضانة|رياض الأطفال|kindergarten|\bkg\b|pre-?k|nursery|reception/i,
  ],
  ["secondary", /ثانو|secondary|high school|\bhigh\b|sixth form/i],
  ["intermediate", /متوسط|إعدادي|اعدادي|intermediate|middle|junior high|prep/i],
  ["primary", /ابتدائ|أساس|اساس|primary|elementary/i],
]

function byName(text: string | null | undefined): LiveStage | null {
  if (!text) return null
  for (const [stage, re] of NAME_RULES) if (re.test(text)) return stage
  return null
}

function byNumber(n: number): LiveStage {
  if (n <= 0) return "kg"
  if (n <= 6) return "primary"
  if (n <= 9) return "intermediate"
  return "secondary"
}

/** The stage of a grade; `null` only when nothing at all is known. */
export function stageOfGrade(input: StageInput): LiveStage | null {
  const named =
    byName(input.gradeName) ??
    byName(input.levelName) ??
    byName(input.yearLevelName)
  if (named) return named
  const n = input.gradeNumber
  if (typeof n === "number" && Number.isFinite(n) && n <= 0) return "kg"
  if (input.level === "HIGH") return "secondary"
  if (input.level === "MIDDLE") return "intermediate"
  if (input.level === "ELEMENTARY") return "primary"
  if (typeof n === "number" && Number.isFinite(n)) return byNumber(n)
  return null
}
