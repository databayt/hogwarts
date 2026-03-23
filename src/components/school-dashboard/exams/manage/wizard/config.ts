// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { WizardConfig } from "@/components/form/wizard"

export const EXAM_WIZARD_CONFIG: WizardConfig = {
  id: "exam",
  steps: ["information", "schedule", "settings"],
  groups: {
    1: ["information"],
    2: ["schedule"],
    3: ["settings"],
  },
  groupLabels: ["Exam Details", "Schedule & Marks", "Proctoring"],
  requiredSteps: ["information", "schedule"],
  finalLabel: "Complete",
}

export const EXAM_TYPE_OPTIONS = [
  { label: "Midterm", value: "MIDTERM" },
  { label: "Final", value: "FINAL" },
  { label: "Quiz", value: "QUIZ" },
  { label: "Test", value: "TEST" },
  { label: "Practical", value: "PRACTICAL" },
] as const

export const PROCTOR_MODE_OPTIONS = [
  { label: "None", value: "NONE" },
  { label: "Basic", value: "BASIC" },
  { label: "Standard", value: "STANDARD" },
  { label: "Strict", value: "STRICT" },
] as const

// --- Dictionary-based factory functions ---
// These accept the exams dictionary section (Record<string, any>)
// and fall back to English defaults when dictionary is not yet loaded.

type ExamsDict = Record<string, any> | undefined

export const getExamWizardGroupLabels = (d?: ExamsDict) => {
  const s = d?.manage?.form?.steps as Record<string, string> | undefined
  return [
    s?.basicInformation || "Exam Details",
    s?.scheduleMarks || "Schedule & Marks",
    d?.manage?.proctoring || "Proctoring",
  ]
}

export const getExamTypeOptionsDynamic = (d?: ExamsDict) => {
  const et = d as Record<string, string> | undefined
  return [
    { value: "MIDTERM", label: et?.midterm || "Midterm" },
    { value: "FINAL", label: et?.final || "Final" },
    { value: "QUIZ", label: et?.quiz || "Quiz" },
    { value: "TEST", label: et?.test || "Test" },
    { value: "PRACTICAL", label: et?.practical || "Practical" },
  ]
}

export const getProctorModeOptions = (d?: ExamsDict) => {
  const pm = d?.manage?.proctorModes as Record<string, string> | undefined
  return [
    { value: "NONE", label: pm?.none || "None" },
    { value: "BASIC", label: pm?.basic || "Basic" },
    { value: "STANDARD", label: pm?.standard || "Standard" },
    { value: "STRICT", label: pm?.strict || "Strict" },
  ]
}

/** Get proctor mode labels map for display */
export const getProctorModeLabels = (d?: ExamsDict): Record<string, string> => {
  const pm = d?.manage?.proctorModes as Record<string, string> | undefined
  return {
    NONE: pm?.none || "None",
    BASIC: pm?.basic || "Basic",
    STANDARD: pm?.standard || "Standard",
    STRICT: pm?.strict || "Strict",
  }
}
