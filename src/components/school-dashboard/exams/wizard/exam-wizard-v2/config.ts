// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { WizardConfig } from "@/components/form/wizard"

export const EXAM_GENERATE_WIZARD_CONFIG: WizardConfig = {
  id: "exam-generate",
  steps: ["template", "exam", "questions", "paper-config", "preview"],
  groups: {
    1: ["template", "exam"],
    2: ["questions"],
    3: ["paper-config", "preview"],
  },
  groupLabels: ["Setup", "Questions", "Finalize"],
  i18nGroupLabels: {
    ar: ["الإعداد", "الأسئلة", "إنهاء"],
    en: ["Setup", "Questions", "Finalize"],
  },
  requiredSteps: ["template", "exam", "questions"],
  finalLabel: "Generate Exam",
  i18nFinalLabel: { ar: "إنشاء الاختبار", en: "Generate Exam" },
}
