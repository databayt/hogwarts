// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { WizardConfig } from "@/components/form/wizard"

export const TEACHER_WIZARD_CONFIG: WizardConfig = {
  id: "teacher",
  steps: [
    "attachments",
    "information",
    "expertise",
    "contact",
    "location",
    "employment",
  ],
  groups: {
    1: ["attachments", "information", "expertise"],
    2: ["contact", "location", "employment"],
  },
  groupLabels: ["Personal Details", "Professional Background"],
  requiredSteps: ["information", "contact"],
  skipToComplete: true,
  finalLabel: "Create",
}

/** Get localized wizard config overrides */
export function getTeacherWizardLabels(wizard?: Record<string, unknown>) {
  const gl = wizard?.groupLabels as Record<string, string> | undefined
  return {
    groupLabels: [
      gl?.personalDetails || "Personal Details",
      gl?.professionalBackground || "Professional Background",
    ],
    finalLabel: (wizard as Record<string, string>)?.create || "Create",
  }
}
