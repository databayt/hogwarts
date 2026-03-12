// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { WizardConfig } from "@/components/form/wizard"

export const ANNOUNCEMENT_WIZARD_CONFIG: WizardConfig = {
  id: "announcement",
  steps: ["content", "targeting"],
  groups: {
    1: ["content"],
    2: ["targeting"],
  },
  groupLabels: ["Content", "Targeting & Publishing"],
  requiredSteps: ["content"],
  finalLabel: "Publish",
}
