// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { WizardConfig } from "@/components/form/wizard"

/** Structure only — labels come from the dictionary (getDictAssignmentWizardConfig). */
export const ASSIGNMENT_WIZARD_CONFIG: WizardConfig = {
  id: "assignment",
  steps: ["information", "details"],
  groups: {
    1: ["information"],
    2: ["details"],
  },
  groupLabels: ["", ""],
  requiredSteps: ["information", "details"],
  finalLabel: "",
}

// --- Dictionary-based factory functions ---
// These accept a dictionary section (`school.assignments`).

type Dict = Record<string, any> | undefined

/** Dictionary-based wizard config */
export const getDictAssignmentWizardConfig = (d?: Dict): WizardConfig => {
  const w = d?.wizard as Record<string, string> | undefined
  return {
    ...ASSIGNMENT_WIZARD_CONFIG,
    groupLabels: [
      w?.assignmentInfo ?? "",
      w?.detailsAndGrading ?? "",
    ],
    finalLabel: w?.createAssignment ?? "",
  }
}

/** Dictionary-based assessment type options */
export const getDictAssessmentTypeOptions = (d?: Dict) => {
  const t = d?.detail?.types as Record<string, string> | undefined
  return [
    { label: t?.homework ?? "", value: "HOMEWORK" },
    { label: t?.quiz ?? "", value: "QUIZ" },
    { label: t?.test ?? "", value: "TEST" },
    { label: t?.midterm ?? "", value: "MIDTERM" },
    { label: t?.finalExam ?? "", value: "FINAL_EXAM" },
    { label: t?.project ?? "", value: "PROJECT" },
    { label: t?.labReport ?? "", value: "LAB_REPORT" },
    { label: t?.essay ?? "", value: "ESSAY" },
    { label: t?.presentation ?? "", value: "PRESENTATION" },
  ]
}
