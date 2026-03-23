// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { WizardConfig } from "@/components/form/wizard"

/** Default wizard config with English labels. Use getAssignmentWizardConfig(lang) for i18n. */
export const ASSIGNMENT_WIZARD_CONFIG: WizardConfig = {
  id: "assignment",
  steps: ["information", "details"],
  groups: {
    1: ["information"],
    2: ["details"],
  },
  groupLabels: ["Assignment Info", "Details & Grading"],
  requiredSteps: ["information", "details"],
  finalLabel: "Create Assignment",
}

export const getAssignmentWizardConfig = (lang?: string): WizardConfig => ({
  ...ASSIGNMENT_WIZARD_CONFIG,
  groupLabels:
    lang === "ar"
      ? ["معلومات الواجب", "التفاصيل والتقييم"]
      : ["Assignment Info", "Details & Grading"],
  finalLabel: lang === "ar" ? "إنشاء واجب" : "Create Assignment",
})

/** @deprecated Use getAssignmentTypes from ../config for bilingual support */
export const ASSESSMENT_TYPE_OPTIONS = [
  { label: "Homework", value: "HOMEWORK" },
  { label: "Quiz", value: "QUIZ" },
  { label: "Test", value: "TEST" },
  { label: "Midterm", value: "MIDTERM" },
  { label: "Final Exam", value: "FINAL_EXAM" },
  { label: "Project", value: "PROJECT" },
  { label: "Lab Report", value: "LAB_REPORT" },
  { label: "Essay", value: "ESSAY" },
  { label: "Presentation", value: "PRESENTATION" },
]

// --- Dictionary-based factory functions ---
// These accept a dictionary section (Record<string, any>) and fall back to
// English defaults when dictionary is not yet loaded.

type Dict = Record<string, any> | undefined

/** Dictionary-based wizard config */
export const getDictAssignmentWizardConfig = (d?: Dict): WizardConfig => {
  const w = d?.wizard as Record<string, string> | undefined
  return {
    ...ASSIGNMENT_WIZARD_CONFIG,
    groupLabels: [
      w?.assignmentInfo || "Assignment Info",
      w?.detailsAndGrading || "Details & Grading",
    ],
    finalLabel: w?.createAssignment || "Create Assignment",
  }
}

/** Dictionary-based assessment type options */
export const getDictAssessmentTypeOptions = (d?: Dict) => {
  const t = d?.detail?.types as Record<string, string> | undefined
  return [
    { label: t?.homework || "Homework", value: "HOMEWORK" },
    { label: t?.quiz || "Quiz", value: "QUIZ" },
    { label: t?.test || "Test", value: "TEST" },
    { label: t?.midterm || "Midterm", value: "MIDTERM" },
    { label: t?.finalExam || "Final Exam", value: "FINAL_EXAM" },
    { label: t?.project || "Project", value: "PROJECT" },
    { label: t?.labReport || "Lab Report", value: "LAB_REPORT" },
    { label: t?.essay || "Essay", value: "ESSAY" },
    { label: t?.presentation || "Presentation", value: "PRESENTATION" },
  ]
}
