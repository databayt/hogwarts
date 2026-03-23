// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/** @deprecated Use getSteps(lang) for bilingual support */
export const STEPS = {
  1: "Basic Information",
  2: "Details & Settings",
} as const

export const getSteps = (lang?: string) => ({
  1: lang === "ar" ? "المعلومات الأساسية" : "Basic Information",
  2: lang === "ar" ? "التفاصيل والإعدادات" : "Details & Settings",
})

export const STEP_FIELDS = {
  1: ["title", "description", "classId"] as const,
  2: ["type", "totalPoints", "weight", "dueDate", "instructions"] as const,
} as const

export const TOTAL_FIELDS = [...STEP_FIELDS[1], ...STEP_FIELDS[2]].length

export const ASSIGNMENT_TYPES = [
  { label: "Homework", value: "HOMEWORK" },
  { label: "Quiz", value: "QUIZ" },
  { label: "Test", value: "TEST" },
  { label: "Midterm", value: "MIDTERM" },
  { label: "Final Exam", value: "FINAL_EXAM" },
  { label: "Project", value: "PROJECT" },
  { label: "Lab Report", value: "LAB_REPORT" },
  { label: "Essay", value: "ESSAY" },
  { label: "Presentation", value: "PRESENTATION" },
] as const

export const ASSIGNMENT_STATUSES = [
  { label: "Draft", value: "DRAFT" },
  { label: "Published", value: "PUBLISHED" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Graded", value: "GRADED" },
] as const

// --- Bilingual factory functions ---

export const getAssignmentTypes = (lang?: string) => [
  { value: "HOMEWORK", label: lang === "ar" ? "واجب منزلي" : "Homework" },
  { value: "QUIZ", label: lang === "ar" ? "اختبار قصير" : "Quiz" },
  { value: "TEST", label: lang === "ar" ? "اختبار" : "Test" },
  { value: "MIDTERM", label: lang === "ar" ? "منتصف الفصل" : "Midterm" },
  { value: "FINAL_EXAM", label: lang === "ar" ? "اختبار نهائي" : "Final Exam" },
  { value: "PROJECT", label: lang === "ar" ? "مشروع" : "Project" },
  { value: "LAB_REPORT", label: lang === "ar" ? "تقرير مختبر" : "Lab Report" },
  { value: "ESSAY", label: lang === "ar" ? "مقال" : "Essay" },
  {
    value: "PRESENTATION",
    label: lang === "ar" ? "عرض تقديمي" : "Presentation",
  },
]

export const getAssignmentStatuses = (lang?: string) => [
  { value: "DRAFT", label: lang === "ar" ? "مسودة" : "Draft" },
  { value: "PUBLISHED", label: lang === "ar" ? "منشور" : "Published" },
  { value: "IN_PROGRESS", label: lang === "ar" ? "جاري" : "In Progress" },
  { value: "COMPLETED", label: lang === "ar" ? "مكتمل" : "Completed" },
  { value: "GRADED", label: lang === "ar" ? "تم التقييم" : "Graded" },
]

// --- Dictionary-based factory functions ---
// These accept a dictionary section (Record<string, any>) and fall back to
// English defaults when dictionary is not yet loaded.

type Dict = Record<string, any> | undefined

export const getDictSteps = (d?: Dict) => {
  const w = d?.wizard as Record<string, string> | undefined
  return {
    1: w?.assignmentInfo || "Basic Information",
    2: w?.detailsAndGrading || "Details & Settings",
  }
}

export const getDictAssignmentTypes = (d?: Dict) => {
  const t = d?.detail?.types as Record<string, string> | undefined
  return [
    { value: "HOMEWORK", label: t?.homework || "Homework" },
    { value: "QUIZ", label: t?.quiz || "Quiz" },
    { value: "TEST", label: t?.test || "Test" },
    { value: "MIDTERM", label: t?.midterm || "Midterm" },
    { value: "FINAL_EXAM", label: t?.finalExam || "Final Exam" },
    { value: "PROJECT", label: t?.project || "Project" },
    { value: "LAB_REPORT", label: t?.labReport || "Lab Report" },
    { value: "ESSAY", label: t?.essay || "Essay" },
    { value: "PRESENTATION", label: t?.presentation || "Presentation" },
  ]
}

export const getDictAssignmentStatuses = (d?: Dict) => {
  const s = d?.detail?.statuses as Record<string, string> | undefined
  return [
    { value: "DRAFT", label: s?.draft || "Draft" },
    { value: "PUBLISHED", label: s?.published || "Published" },
    { value: "IN_PROGRESS", label: s?.inProgress || "In Progress" },
    { value: "COMPLETED", label: s?.completed || "Completed" },
    { value: "GRADED", label: s?.graded || "Graded" },
  ]
}

/** Get assignment type labels map for column display */
export const getAssignmentTypeLabels = (d?: Dict): Record<string, string> => {
  const t = d?.detail?.types as Record<string, string> | undefined
  return {
    HOMEWORK: t?.homework || "Homework",
    QUIZ: t?.quiz || "Quiz",
    TEST: t?.test || "Test",
    MIDTERM: t?.midterm || "Midterm",
    FINAL_EXAM: t?.finalExam || "Final Exam",
    PROJECT: t?.project || "Project",
    LAB_REPORT: t?.labReport || "Lab Report",
    ESSAY: t?.essay || "Essay",
    PRESENTATION: t?.presentation || "Presentation",
  }
}

/** Get assignment status labels map for column display */
export const getAssignmentStatusLabels = (d?: Dict): Record<string, string> => {
  const s = d?.detail?.statuses as Record<string, string> | undefined
  return {
    DRAFT: s?.draft || "Draft",
    PUBLISHED: s?.published || "Published",
    IN_PROGRESS: s?.inProgress || "In Progress",
    COMPLETED: s?.completed || "Completed",
    GRADED: s?.graded || "Graded",
  }
}
