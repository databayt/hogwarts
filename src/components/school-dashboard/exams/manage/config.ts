// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

export const STEPS = {
  1: "Basic Information",
  2: "Schedule & Marks",
  3: "Instructions & Details",
} as const

export const STEP_FIELDS = {
  1: ["title", "description", "classId", "subjectId", "examType"] as const,
  2: [
    "examDate",
    "startTime",
    "endTime",
    "duration",
    "totalMarks",
    "passingMarks",
  ] as const,
  3: ["instructions"] as const,
} as const

export const TOTAL_FIELDS = [
  ...STEP_FIELDS[1],
  ...STEP_FIELDS[2],
  ...STEP_FIELDS[3],
].length

export const EXAM_STATUSES = [
  { label: "Planned", value: "PLANNED" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
] as const

export const EXAM_TYPES = [
  { label: "Midterm", value: "MIDTERM" },
  { label: "Final", value: "FINAL" },
  { label: "Quiz", value: "QUIZ" },
  { label: "Assignment", value: "ASSIGNMENT" },
  { label: "Project", value: "PROJECT" },
] as const

export const TIME_SLOTS = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
] as const

// --- Bilingual factory functions ---

export const getExamStatuses = (lang?: string) => [
  { value: "PLANNED", label: lang === "ar" ? "مخطط" : "Planned" },
  { value: "IN_PROGRESS", label: lang === "ar" ? "جاري" : "In Progress" },
  { value: "COMPLETED", label: lang === "ar" ? "مكتمل" : "Completed" },
  { value: "CANCELLED", label: lang === "ar" ? "ملغي" : "Cancelled" },
]

export const getExamTypes = (lang?: string) => [
  { value: "MIDTERM", label: lang === "ar" ? "منتصف الفصل" : "Midterm" },
  { value: "FINAL", label: lang === "ar" ? "نهائي" : "Final" },
  { value: "QUIZ", label: lang === "ar" ? "اختبار قصير" : "Quiz" },
  { value: "ASSIGNMENT", label: lang === "ar" ? "واجب" : "Assignment" },
  { value: "PROJECT", label: lang === "ar" ? "مشروع" : "Project" },
]
