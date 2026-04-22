// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { WizardConfig } from "@/components/form/wizard"

export const STUDENT_WIZARD_CONFIG: WizardConfig = {
  id: "student",
  steps: ["attachments", "personal", "location", "academic"],
  groups: {
    1: ["attachments", "personal"],
    2: ["location"],
    3: ["academic"],
  },
  groupLabels: ["Basic Information", "Address", "Academic"],
  i18nGroupLabels: {
    ar: ["المعلومات الأساسية", "العنوان", "الأكاديمي"],
    en: ["Basic Information", "Address", "Academic"],
  },
  requiredSteps: ["personal"],
  skipToComplete: true,
  finalLabel: "Create",
  i18nFinalLabel: {
    ar: "إنشاء",
    en: "Create",
  },
}

// Retired step slugs → their new home in the 4-step wizard.
// Used by both the deprecated step pages (to redirect()) and the
// columns/edit link (to normalize `student.wizardStep` on resume).
export const STEP_REDIRECTS: Record<string, string> = {
  guardian: "personal",
  enrollment: "academic",
  contact: "personal",
  health: "personal",
  "previous-education": "academic",
  fees: "academic",
  photo: "attachments",
}

/**
 * Normalize a (possibly deprecated) wizardStep value to a valid slug in
 * STUDENT_WIZARD_CONFIG.steps. Returns the mapped equivalent if the input
 * is a retired step, otherwise returns the input unchanged. Undefined/null
 * inputs resolve to "personal" — the wizard's required entry step.
 */
export function normalizeWizardStep(step: string | null | undefined): string {
  if (!step) return "personal"
  return STEP_REDIRECTS[step] ?? step
}
