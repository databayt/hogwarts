// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { WizardConfig } from "@/components/form/wizard"

export const STUDENT_WIZARD_CONFIG: WizardConfig = {
  id: "student",
  steps: [
    "personal",
    "contact",
    "emergency",
    "enrollment",
    "health",
    "previous-education",
    "review",
  ],
  groups: {
    1: ["personal", "contact"],
    2: ["emergency", "enrollment"],
    3: ["health", "previous-education", "review"],
  },
  groupLabels: ["Personal Details", "Enrollment", "Health & History"],
  requiredSteps: ["personal"],
  finalLabel: "Complete",
}
