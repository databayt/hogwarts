// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { WizardConfig } from "@/components/form/wizard"

import type { QuestionTypeConfig } from "../types"

/** Static steps that are always present */
const STATIC_STEPS_BEFORE_DIFFICULTY = [
  "gallery",
  "name",
  "subject",
  "targeting",
  "question-types",
  "duration-marks",
  "header",
  "student-info",
  "instructions",
  "footer-layout",
  "answer-sheet",
  "cover",
]

const STATIC_STEPS_AFTER_DIFFICULTY = ["scoring", "print", "preview"]

export const TEMPLATE_WIZARD_CONFIG: WizardConfig = {
  id: "exam-template",
  steps: [...STATIC_STEPS_BEFORE_DIFFICULTY, ...STATIC_STEPS_AFTER_DIFFICULTY],
  groups: {
    1: ["gallery"],
    2: ["name", "subject", "targeting", "question-types", "duration-marks"],
    3: [
      "header",
      "student-info",
      "instructions",
      "footer-layout",
      "answer-sheet",
      "cover",
    ],
    4: [], // dynamic difficulty steps
    5: ["scoring", "print", "preview"],
  },
  groupLabels: [
    "Preset",
    "Exam Info",
    "Paper Layout",
    "Distribution",
    "Finalize",
  ],
  requiredSteps: ["name", "subject", "question-types"],
  finalLabel: "Save Template",
  finalDestination: "/exams/generate",
}

/**
 * Build a dynamic config that includes difficulty steps for each selected question type.
 * Called from the layout when template data is loaded.
 */
export function buildDynamicConfig(
  questionTypes: QuestionTypeConfig[]
): WizardConfig {
  const difficultySteps = questionTypes.map(
    (qt) => `difficulty-${qt.type.toLowerCase().replace(/_/g, "-")}`
  )

  return {
    ...TEMPLATE_WIZARD_CONFIG,
    steps: [
      ...STATIC_STEPS_BEFORE_DIFFICULTY,
      ...difficultySteps,
      ...STATIC_STEPS_AFTER_DIFFICULTY,
    ],
    groups: {
      ...TEMPLATE_WIZARD_CONFIG.groups,
      4: difficultySteps,
    },
  }
}
