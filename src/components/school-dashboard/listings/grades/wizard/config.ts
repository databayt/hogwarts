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
