// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { WizardConfig } from "@/components/form/wizard"

export const ANNOUNCEMENT_WIZARD_CONFIG: WizardConfig = {
  id: "announcement",
  steps: ["content"],
  groups: {
    1: ["content"],
  },
  groupLabels: ["Content"],
  i18nGroupLabels: {
    ar: ["المحتوى"],
    en: ["Content"],
  },
  requiredSteps: ["content"],
  finalDestination: "/announcements",
}
