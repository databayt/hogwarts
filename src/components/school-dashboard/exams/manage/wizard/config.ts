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
