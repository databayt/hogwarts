// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { WizardConfig } from "@/components/form/wizard"

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
