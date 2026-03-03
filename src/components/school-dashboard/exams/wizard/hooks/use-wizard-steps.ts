// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { useMemo } from "react"

import type { StepDefinition, TemplateWizardState } from "../types"

/**
 * Computes dynamic step list based on wizard state.
 *
 * Fixed steps: Gallery, Info, Layout
 * Dynamic steps: One per unique question type selected in step 2
 * Fixed steps: Scoring, Footer & Print, Preview
 */
export function useWizardSteps(state: TemplateWizardState): StepDefinition[] {
  return useMemo(() => {
    const steps: StepDefinition[] = [
      {
        id: "gallery",
        label: { en: "Choose Template", ar: "اختر قالب" },
        isComplete: () => true,
      },
      {
        id: "info",
        label: { en: "Exam Info", ar: "معلومات الاختبار" },
        isComplete: (s) =>
          s.name.length > 0 &&
          s.subjectIds.length > 0 &&
          s.questionTypes.length > 0,
      },
      {
        id: "layout",
        label: { en: "Paper Layout", ar: "تخطيط الورقة" },
        isComplete: (s) =>
          s.headerVariant.length > 0 && s.footerVariant.length > 0,
      },
    ]

    // Dynamic question type steps
    const questionSteps: StepDefinition[] = state.questionTypes.map(
      (qt, idx) => ({
        id: `question-${qt.type}`,
        label: {
          en: formatQuestionType(qt.type, "en"),
          ar: formatQuestionType(qt.type, "ar"),
        },
        isComplete: (s) => {
          const config = s.questionTypes[idx]
          if (!config) return false
          const total =
            config.difficulty.EASY +
            config.difficulty.MEDIUM +
            config.difficulty.HARD
          return total === config.count
        },
      })
    )

    steps.push(...questionSteps)

    steps.push(
      {
        id: "scoring",
        label: { en: "Scoring & Grades", ar: "الدرجات والتقديرات" },
        isComplete: (s) => s.gradeBoundaries.length > 0,
      },
      {
        id: "footer-print",
        label: { en: "Footer & Print", ar: "التذييل والطباعة" },
        isComplete: (s) => s.footerVariant.length > 0,
      },
      {
        id: "preview",
        label: { en: "Preview", ar: "معاينة" },
        isComplete: () => true,
      }
    )

    return steps
  }, [state.questionTypes])
}

function formatQuestionType(type: string, lang: "en" | "ar"): string {
  const labels: Record<string, { en: string; ar: string }> = {
    MULTIPLE_CHOICE: { en: "MCQ Config", ar: "اختيار متعدد" },
    TRUE_FALSE: { en: "True/False", ar: "صح/خطأ" },
    SHORT_ANSWER: { en: "Short Answer", ar: "إجابة قصيرة" },
    ESSAY: { en: "Essay", ar: "مقال" },
    FILL_BLANK: { en: "Fill Blank", ar: "أكمل" },
    MATCHING: { en: "Matching", ar: "مطابقة" },
    ORDERING: { en: "Ordering", ar: "ترتيب" },
  }
  return labels[type]?.[lang] || type
}
