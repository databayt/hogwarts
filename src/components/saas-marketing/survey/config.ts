// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The survey's single source of truth. The flip-screen UI, the server
 * validator and the Google Form generator (scripts/survey/build-gform.mjs)
 * all read this list — the words live in dictionaries/{ar,en}/survey.json,
 * keyed by the same ids.
 */

export const SURVEY_ID = "digital-transformation-2026"

export type SectionId =
  | "school"
  | "systems"
  | "needs"
  | "future"
  | "golden"
  | "end"

export type QuestionType = "single" | "multi" | "scale" | "text" | "email"

export type AnswerValue = string | string[] | number

export type Answers = Record<string, AnswerValue | undefined>

export interface Question {
  id: string
  section: SectionId
  type: QuestionType
  /** Option ids, in order. single + multi only. */
  options?: readonly string[]
  /** The option that opens a free-text box ("أخرى"). */
  other?: string
  /** A multi option that clears the others ("لا توجد تحديات كبيرة"). */
  exclusive?: string
  optional?: boolean
  /** The question shows only when this answer matches. */
  showIf?: { id: string; equals: string }
}

export const SECTIONS: readonly SectionId[] = [
  "school",
  "systems",
  "needs",
  "future",
  "golden",
  "end",
]

export const QUESTIONS: readonly Question[] = [
  // القسم الأول | عن المدرسة
  {
    id: "institution",
    section: "school",
    type: "single",
    options: ["private", "international", "public", "group", "other"],
    other: "other",
  },
  {
    id: "students",
    section: "school",
    type: "single",
    options: ["lt300", "300to700", "701to1500", "1501to3000", "gt3000"],
  },
  {
    id: "role",
    section: "school",
    type: "single",
    options: [
      "executive",
      "principal",
      "operations",
      "it",
      "finance",
      "hr",
      "admissions",
      "marketing",
      "academic",
      "other",
    ],
    other: "other",
  },

  // القسم الثاني | الأنظمة والمنصات
  {
    id: "systems",
    section: "systems",
    type: "multi",
    options: [
      "sis",
      "crm",
      "admissions",
      "finance",
      "hr",
      "attendance",
      "lms",
      "parentComms",
      "other",
    ],
    other: "other",
  },
  {
    id: "integration",
    section: "systems",
    type: "single",
    options: ["full", "partial", "separate", "unsure"],
  },
  { id: "satisfaction", section: "systems", type: "scale" },
  {
    id: "challenges",
    section: "systems",
    type: "multi",
    options: [
      "usability",
      "support",
      "integration",
      "cost",
      "reporting",
      "training",
      "flexibility",
      "parentComms",
      "technical",
      "none",
      "other",
    ],
    other: "other",
    exclusive: "none",
  },

  // القسم الثالث | ماذا تحتاج المدرسة؟
  {
    id: "needs",
    section: "needs",
    type: "multi",
    options: [
      "studentData",
      "admissions",
      "parentComms",
      "crm",
      "fees",
      "attendance",
      "hr",
      "dashboards",
      "academic",
      "branches",
      "marketing",
    ],
  },
  {
    id: "factors",
    section: "needs",
    type: "multi",
    options: [
      "usability",
      "cost",
      "support",
      "integration",
      "reporting",
      "mobile",
      "security",
      "customization",
      "ai",
      "branches",
      "parentExperience",
    ],
  },
  {
    id: "change",
    section: "needs",
    type: "single",
    options: ["yes", "maybe", "no", "undecided"],
  },

  // القسم الرابع | المستقبل
  { id: "aiImportance", section: "future", type: "scale" },
  {
    id: "aiValue",
    section: "future",
    type: "single",
    options: [
      "analytics",
      "parentService",
      "marketing",
      "reports",
      "students",
      "hr",
      "teaching",
      "automation",
      "other",
    ],
    other: "other",
  },
  { id: "wish", section: "future", type: "text", optional: true },

  // السؤال الذهبي
  { id: "currentSystem", section: "golden", type: "text", optional: true },

  // وفي النهاية
  {
    id: "wantsResults",
    section: "end",
    type: "single",
    options: ["yes", "no"],
  },
  {
    id: "email",
    section: "end",
    type: "email",
    showIf: { id: "wantsResults", equals: "yes" },
  },
]

export const SCALE = [1, 2, 3, 4, 5] as const

/** Midpoints for Prospect.studentCountEstimate. */
export const STUDENT_BAND_ESTIMATE: Record<string, number> = {
  lt300: 200,
  "300to700": 500,
  "701to1500": 1100,
  "1501to3000": 2250,
  gt3000: 3500,
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function visibleQuestions(answers: Answers): Question[] {
  return QUESTIONS.filter(
    (q) => !q.showIf || answers[q.showIf.id] === q.showIf.equals
  )
}

/** The `others` key holding a question's "أخرى" text. */
export const otherKey = (id: string) => `${id}Other`

/** Is this question answered well enough to move on? */
export function isAnswered(q: Question, answers: Answers): boolean {
  const value = answers[q.id]
  if (q.optional && (value === undefined || value === "")) return true
  switch (q.type) {
    case "single":
      if (typeof value !== "string" || !q.options?.includes(value)) {
        return false
      }
      return value !== q.other || hasText(answers[otherKey(q.id)])
    case "multi":
      if (!Array.isArray(value) || value.length === 0) return false
      if (!value.every((v) => q.options?.includes(v))) return false
      return !value.includes(q.other ?? "") || hasText(answers[otherKey(q.id)])
    case "scale":
      return typeof value === "number" && value >= 1 && value <= 5
    case "text":
      return typeof value === "string" && value.trim().length > 0
    case "email":
      return typeof value === "string" && EMAIL_PATTERN.test(value.trim())
  }
}

const hasText = (v: AnswerValue | undefined) =>
  typeof v === "string" && v.trim().length > 0
