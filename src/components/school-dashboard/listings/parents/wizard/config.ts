// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { WizardConfig } from "@/components/form/wizard"

export const PARENT_WIZARD_CONFIG: WizardConfig = {
  id: "parent",
  steps: ["information", "contact"],
  groups: {
    1: ["information"],
    2: ["contact"],
  },
  groupLabels: ["Personal Info", "Contact Details"],
  requiredSteps: ["information"],
  finalLabel: "Complete",
}
