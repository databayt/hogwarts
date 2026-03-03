// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import { useReducer } from "react"

import type {
  ExamWizardAction,
  ExamWizardState,
  ExamWizardStepDef,
} from "./types"
import { INITIAL_EXAM_WIZARD_STATE } from "./types"

function examWizardReducer(
  state: ExamWizardState,
  action: ExamWizardAction
): ExamWizardState {
  switch (action.type) {
    case "SET_TEMPLATE":
      return { ...state, templateId: action.payload }
    case "SET_EXAM_MODE":
      return { ...state, examMode: action.payload }
    case "SET_EXISTING_EXAM":
      return { ...state, existingExamId: action.payload }
    case "SET_NEW_EXAM":
      return { ...state, ...action.payload }
    case "SET_QUESTIONS":
      return { ...state, selectedQuestionIds: action.payload }
    case "SET_AUTO_FILLED":
      return { ...state, autoFilled: action.payload }
    case "SET_PAPER_CONFIG":
      return { ...state, ...action.payload }
    case "SET_STEP":
      return { ...state, currentStep: action.payload }
    case "NEXT_STEP":
      return { ...state, currentStep: state.currentStep + 1 }
    case "PREV_STEP":
      return { ...state, currentStep: Math.max(0, state.currentStep - 1) }
    default:
      return state
  }
}

export function useExamWizardState() {
  return useReducer(examWizardReducer, INITIAL_EXAM_WIZARD_STATE)
}

export function getExamWizardSteps(): ExamWizardStepDef[] {
  return [
    {
      id: "template",
      label: { en: "Select Template", ar: "اختر القالب" },
      isComplete: (s) => !!s.templateId,
    },
    {
      id: "exam",
      label: { en: "Exam Details", ar: "تفاصيل الاختبار" },
      isComplete: (s) =>
        s.examMode === "existing"
          ? !!s.existingExamId
          : !!s.newExamTitle && !!s.newExamClassId && !!s.newExamDate,
    },
    {
      id: "questions",
      label: { en: "Question Bank", ar: "بنك الأسئلة" },
      isComplete: (s) => s.selectedQuestionIds.length > 0,
    },
    {
      id: "paper-config",
      label: { en: "Paper Config", ar: "إعدادات الورقة" },
      isComplete: () => true, // Always valid with defaults
    },
    {
      id: "preview",
      label: { en: "Review & Generate", ar: "مراجعة وإنشاء" },
      isComplete: () => false, // Final step
    },
  ]
}
