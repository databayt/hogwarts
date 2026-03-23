// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { WizardConfig } from "@/components/form/wizard"

export const QUESTION_WIZARD_CONFIG: WizardConfig = {
  id: "question",
  steps: ["question", "answers"],
  groups: {
    1: ["question"],
    2: ["answers"],
  },
  groupLabels: ["Question Details", "Answer Options"],
  requiredSteps: ["question", "answers"],
  finalLabel: "Save Question",
}

export const QUESTION_TYPE_OPTIONS = [
  { label: "Multiple Choice", value: "MULTIPLE_CHOICE" },
  { label: "True / False", value: "TRUE_FALSE" },
  { label: "Fill in the Blank", value: "FILL_BLANK" },
  { label: "Short Answer", value: "SHORT_ANSWER" },
  { label: "Essay", value: "ESSAY" },
  { label: "Matching", value: "MATCHING" },
  { label: "Ordering", value: "ORDERING" },
  { label: "Multi Select", value: "MULTI_SELECT" },
] as const

export const DIFFICULTY_OPTIONS = [
  { label: "Easy", value: "EASY" },
  { label: "Medium", value: "MEDIUM" },
  { label: "Hard", value: "HARD" },
] as const

export const BLOOM_LEVEL_OPTIONS = [
  { label: "Remember", value: "REMEMBER" },
  { label: "Understand", value: "UNDERSTAND" },
  { label: "Apply", value: "APPLY" },
  { label: "Analyze", value: "ANALYZE" },
  { label: "Evaluate", value: "EVALUATE" },
  { label: "Create", value: "CREATE" },
] as const

// --- Dictionary-based factory functions ---
// These accept the exams dictionary section (Record<string, any>)
// and fall back to English defaults when dictionary is not yet loaded.

type ExamsDict = Record<string, any> | undefined

export const getQuestionWizardGroupLabels = (d?: ExamsDict) => {
  const w = d?.qbankUi?.wizard as Record<string, any> | undefined
  return [
    w?.question?.detailsTitle || "Question Details",
    w?.answers?.answerOptions || "Answer Options",
  ]
}

export const getQuestionWizardFinalLabel = (d?: ExamsDict) => {
  const w = d?.qbankUi?.wizard as Record<string, any> | undefined
  return w?.saveQuestion || "Save Question"
}

export const getQuestionTypeOptionsDynamic = (d?: ExamsDict) => {
  const qt = d?.qbankUi?.config?.questionTypes as
    | Record<string, string>
    | undefined
  return [
    { value: "MULTIPLE_CHOICE", label: qt?.mcq || "Multiple Choice" },
    { value: "TRUE_FALSE", label: qt?.trueFalse || "True / False" },
    { value: "FILL_BLANK", label: qt?.fillBlank || "Fill in the Blank" },
    { value: "SHORT_ANSWER", label: qt?.shortAnswer || "Short Answer" },
    { value: "ESSAY", label: qt?.essay || "Essay" },
    { value: "MATCHING", label: qt?.matching || "Matching" },
    { value: "ORDERING", label: qt?.ordering || "Ordering" },
    { value: "MULTI_SELECT", label: qt?.multiSelect || "Multi Select" },
  ]
}

export const getDifficultyOptionsDynamic = (d?: ExamsDict) => {
  const dl = d?.qbankUi?.config?.difficulty as
    | Record<string, string>
    | undefined
  return [
    { value: "EASY", label: dl?.easy || "Easy" },
    { value: "MEDIUM", label: dl?.medium || "Medium" },
    { value: "HARD", label: dl?.hard || "Hard" },
  ]
}

export const getBloomLevelOptionsDynamic = (d?: ExamsDict) => {
  const bl = d?.qbankUi?.config?.bloomLevels as
    | Record<string, string>
    | undefined
  return [
    { value: "REMEMBER", label: bl?.remember || "Remember" },
    { value: "UNDERSTAND", label: bl?.understand || "Understand" },
    { value: "APPLY", label: bl?.apply || "Apply" },
    { value: "ANALYZE", label: bl?.analyze || "Analyze" },
    { value: "EVALUATE", label: bl?.evaluate || "Evaluate" },
    { value: "CREATE", label: bl?.create || "Create" },
  ]
}
