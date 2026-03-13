// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { WizardConfig } from "@/components/form/wizard"

export const STUDENT_WIZARD_CONFIG: WizardConfig = {
  id: "student",
  steps: [
    "photo",
    "personal",
    "enrollment",
    "contact",
    "location",
    "health",
    "previous-education",
  ],
  groups: {
    1: ["photo", "personal", "enrollment"],
    2: ["contact", "location"],
    3: ["health", "previous-education"],
  },
  groupLabels: ["Essentials", "Contact Details", "Health & History"],
  requiredSteps: ["personal"],
  skipToComplete: true,
  finalLabel: "Complete",
}
