// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { WizardConfig } from "@/components/form/wizard"

export const QUESTION_WIZARD_CONFIG: WizardConfig = {
  id: "question",
  steps: ["question", "answers"],
  groups: {
    1: ["question"],
    2: ["answers"],
  },
  groupLabels: ["Question Details", "Answer Options"],
  requiredSteps: ["question", "answers"],
  finalLabel: "Save Question",
}

export const QUESTION_TYPE_OPTIONS = [
  { label: "Multiple Choice", value: "MULTIPLE_CHOICE" },
  { label: "True / False", value: "TRUE_FALSE" },
  { label: "Fill in the Blank", value: "FILL_BLANK" },
  { label: "Short Answer", value: "SHORT_ANSWER" },
  { label: "Essay", value: "ESSAY" },
  { label: "Matching", value: "MATCHING" },
  { label: "Ordering", value: "ORDERING" },
  { label: "Multi Select", value: "MULTI_SELECT" },
] as const

export const DIFFICULTY_OPTIONS = [
  { label: "Easy", value: "EASY" },
  { label: "Medium", value: "MEDIUM" },
  { label: "Hard", value: "HARD" },
] as const

export const BLOOM_LEVEL_OPTIONS = [
  { label: "Remember", value: "REMEMBER" },
  { label: "Understand", value: "UNDERSTAND" },
  { label: "Apply", value: "APPLY" },
  { label: "Analyze", value: "ANALYZE" },
  { label: "Evaluate", value: "EVALUATE" },
  { label: "Create", value: "CREATE" },
] as const
