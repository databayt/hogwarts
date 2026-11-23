// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { WizardConfig } from "@/components/form/wizard"

/**
 * The wizard layout (an app route, outside this block) takes a static config,
 * so the per-locale labels travel through the wizard's own `i18n*` fields. The
 * same strings live in the dictionary as `exams.qbank.wizard.groupQuestion /
 * groupAnswers / saveQuestion`; once the layout reads the dictionary it can
 * build the config with `createQuestionWizardConfig(t)` instead.
 */
export const QUESTION_WIZARD_CONFIG: WizardConfig = {
  id: "question",
  steps: ["question", "answers"],
  groups: {
    1: ["question"],
    2: ["answers"],
  },
  i18nGroupLabels: {
    ar: ["تفاصيل السؤال", "خيارات الإجابة"],
    en: ["Question Details", "Answer Options"],
  },
  requiredSteps: ["question", "answers"],
  i18nFinalLabel: { ar: "حفظ السؤال", en: "Save Question" },
}

/** Dictionary-driven variant: `t` is `dictionary.exams.qbank`. */
export const createQuestionWizardConfig = (
  t?: Record<string, any>
): WizardConfig => ({
  id: "question",
  steps: ["question", "answers"],
  groups: { 1: ["question"], 2: ["answers"] },
  groupLabels: [t?.wizard?.groupQuestion ?? "", t?.wizard?.groupAnswers ?? ""],
  requiredSteps: ["question", "answers"],
  finalLabel: t?.wizard?.saveQuestion ?? "",
})

// --- Dictionary-based option builders ---
// `t` is the `exams.qbank` subtree. No English fallbacks.

type QbankDict = Record<string, any> | undefined

export const getQuestionTypeOptionsDynamic = (t?: QbankDict) => {
  const qt = t?.config?.questionTypes as Record<string, string> | undefined
  return [
    { value: "MULTIPLE_CHOICE", label: qt?.mcq ?? "" },
    { value: "TRUE_FALSE", label: qt?.trueFalse ?? "" },
    { value: "FILL_BLANK", label: qt?.fillBlank ?? "" },
    { value: "SHORT_ANSWER", label: qt?.shortAnswer ?? "" },
    { value: "ESSAY", label: qt?.essay ?? "" },
    { value: "MATCHING", label: qt?.matching ?? "" },
    { value: "ORDERING", label: qt?.ordering ?? "" },
    { value: "MULTI_SELECT", label: qt?.multiSelect ?? "" },
  ]
}

export const getDifficultyOptionsDynamic = (t?: QbankDict) => {
  const dl = t?.config?.difficulty as Record<string, string> | undefined
  return [
    { value: "EASY", label: dl?.easy ?? "" },
    { value: "MEDIUM", label: dl?.medium ?? "" },
    { value: "HARD", label: dl?.hard ?? "" },
  ]
}

export const getBloomLevelOptionsDynamic = (t?: QbankDict) => {
  const bl = t?.config?.bloomLevels as Record<string, string> | undefined
  return [
    { value: "REMEMBER", label: bl?.remember ?? "" },
    { value: "UNDERSTAND", label: bl?.understand ?? "" },
    { value: "APPLY", label: bl?.apply ?? "" },
    { value: "ANALYZE", label: bl?.analyze ?? "" },
    { value: "EVALUATE", label: bl?.evaluate ?? "" },
    { value: "CREATE", label: bl?.create ?? "" },
  ]
}
