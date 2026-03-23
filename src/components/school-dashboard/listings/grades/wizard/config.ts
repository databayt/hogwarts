// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { WizardConfig } from "@/components/form/wizard"

export const GRADE_WIZARD_CONFIG: WizardConfig = {
  id: "grade",
  steps: ["selection", "scoring"],
  groups: {
    1: ["selection"],
    2: ["scoring"],
  },
  groupLabels: ["Student & Assignment", "Score & Grade"],
  requiredSteps: ["selection", "scoring"],
  finalLabel: "Save Grade",
}

// --- Dictionary-based factory functions ---
// These accept a dictionary section (Record<string, any>) and fall back to
// English defaults when dictionary is not yet loaded.

type Dict = Record<string, any> | undefined

/** Dictionary-based wizard config */
export const getDictGradeWizardConfig = (d?: Dict): WizardConfig => ({
  ...GRADE_WIZARD_CONFIG,
  groupLabels: [
    d?.wizardSelectionTitle || "Student & Assignment",
    d?.wizardScoringTitle || "Score & Grade",
  ],
  finalLabel: d?.saveGrade || "Save Grade",
})
