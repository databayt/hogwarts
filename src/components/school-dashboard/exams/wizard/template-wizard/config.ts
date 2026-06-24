// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { WizardConfig } from "@/components/form/wizard"

/**
 * Exam template wizard — 5 one-screen steps.
 *
 * gallery → basics → questions → difficulty → review
 *
 * Appearance is chosen once on the `gallery` step (a region preset writes the
 * full blockConfig: slots + decorations), so the legacy per-slot layout steps
 * and the print step no longer exist. Difficulty collapses to a single table
 * step (no more one-step-per-question-type), and scoring folds into review.
 */
export const TEMPLATE_WIZARD_CONFIG: WizardConfig = {
  id: "exam-template",
  steps: ["gallery", "basics", "questions", "difficulty", "review"],
  groups: {
    1: ["gallery"],
    2: ["basics"],
    3: ["questions", "difficulty"],
    4: ["review"],
  },
  groupLabels: ["Start", "Basics", "Questions", "Review"],
  i18nGroupLabels: {
    ar: ["البداية", "الأساسيات", "الأسئلة", "المراجعة"],
    en: ["Start", "Basics", "Questions", "Review"],
  },
  requiredSteps: ["basics", "questions"],
  finalLabel: "Save Template",
  i18nFinalLabel: { ar: "حفظ القالب", en: "Save Template" },
  finalDestination: "/exams/generate",
}

const TEMPLATE_BASE_PATH = "/exams/template/add"

/**
 * Path to the step after `currentStep`, or `undefined` if it is the last step.
 * Centralizes step order so reordering only requires editing `steps` above.
 * Returns a locale-less path (matches the existing wizard `nextStep` convention).
 */
export function getNextStep(
  currentStep: string,
  templateId: string
): string | undefined {
  const idx = TEMPLATE_WIZARD_CONFIG.steps.indexOf(currentStep)
  if (idx < 0 || idx >= TEMPLATE_WIZARD_CONFIG.steps.length - 1)
    return undefined
  return `${TEMPLATE_BASE_PATH}/${templateId}/${TEMPLATE_WIZARD_CONFIG.steps[idx + 1]}`
}

/**
 * Map legacy/removed step slugs (from drafts created before the refactor) to the
 * nearest surviving step, so an in-flight draft resumes on a valid screen.
 */
export const TEMPLATE_STEP_REDIRECTS: Record<string, string> = {
  name: "basics",
  subject: "basics",
  targeting: "basics",
  "duration-marks": "basics",
  "question-types": "questions",
  header: "gallery",
  "student-info": "gallery",
  instructions: "gallery",
  "footer-layout": "gallery",
  "answer-sheet": "gallery",
  cover: "gallery",
  scoring: "review",
  print: "review",
  preview: "review",
}

/**
 * Normalize a persisted `wizardStep` to a valid current step.
 * - `null`/`undefined` (completed) → `null`
 * - a current step → itself
 * - a dynamic `difficulty-<type>` slug → `difficulty`
 * - a known legacy slug → its mapped survivor
 * - anything else → `gallery`
 */
export function normalizeTemplateWizardStep(
  step: string | null | undefined
): string | null {
  if (!step) return null
  if (TEMPLATE_WIZARD_CONFIG.steps.includes(step)) return step
  if (step.startsWith("difficulty-")) return "difficulty"
  return TEMPLATE_STEP_REDIRECTS[step] ?? "gallery"
}
