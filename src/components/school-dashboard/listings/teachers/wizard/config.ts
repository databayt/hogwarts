// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { WizardConfig } from "@/components/form/wizard"

export const TEACHER_WIZARD_CONFIG: WizardConfig = {
  id: "teacher",
  steps: [
    "photo",
    "information",
    "contact",
    "employment",
    "qualifications",
    "experience",
    "expertise",
  ],
  groups: {
    1: ["photo", "information", "contact"],
    2: ["employment", "qualifications", "experience"],
    3: ["expertise"],
  },
  groupLabels: ["Personal Details", "Professional Background", "Expertise"],
  requiredSteps: ["information", "contact"],
  skipToComplete: true,
  finalLabel: "Complete",
}
