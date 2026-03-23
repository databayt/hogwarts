// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { WizardConfig } from "@/components/form/wizard"
import type { Dictionary } from "@/components/internationalization/dictionaries"

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

/** Returns a localized copy of the wizard config */
export function getLocalizedWizardConfig(
  d?: Dictionary["school"]["classes"]
): WizardConfig {
  const w = d?.wizard
  return {
    ...CLASS_WIZARD_CONFIG,
    groupLabels: [
      w?.groupLabels?.classDetails || "Class Details",
      w?.groupLabels?.schedule || "Schedule",
      w?.groupLabels?.management || "Management",
    ],
    finalLabel: w?.complete || "Complete",
  }
}
