// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { WizardConfig } from "@/components/form/wizard"

export const CLASS_WIZARD_CONFIG: WizardConfig = {
  id: "class",
  steps: ["information", "schedule", "management"],
  groups: {
    1: ["information"],
    2: ["schedule"],
    3: ["management"],
  },
  groupLabels: ["Class Details", "Schedule", "Management"],
  requiredSteps: ["information", "schedule"],
  finalLabel: "Complete",
}
