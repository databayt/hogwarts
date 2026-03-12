// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { WizardConfig } from "@/components/form/wizard"

export const TEACHER_WIZARD_CONFIG: WizardConfig = {
  id: "teacher",
  steps: [
    "information",
    "contact",
    "employment",
    "qualifications",
    "experience",
    "expertise",
    "review",
  ],
  groups: {
    1: ["information", "contact"],
    2: ["employment", "qualifications", "experience"],
    3: ["expertise", "review"],
  },
  groupLabels: [
    "Personal Details",
    "Professional Background",
    "Expertise & Review",
  ],
  requiredSteps: ["information", "contact"],
  finalLabel: "Complete",
}
