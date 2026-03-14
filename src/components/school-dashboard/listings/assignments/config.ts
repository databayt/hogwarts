// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

export const STEPS = {
  1: "Basic Information",
  2: "Details & Settings",
} as const

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
