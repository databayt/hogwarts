// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { useCallback, useEffect, useReducer } from "react"

import {
  INITIAL_STATE,
  type TemplateWizardState,
  type WizardAction,
} from "../types"

function wizardReducer(
  state: TemplateWizardState,
  action: WizardAction
): TemplateWizardState {
  switch (action.type) {
    case "SET_INFO":
      return { ...state, ...action.payload }
    case "SET_HEADER_VARIANT":
      return { ...state, headerVariant: action.payload }
    case "SET_FOOTER_VARIANT":
      return { ...state, footerVariant: action.payload }
    case "SET_STUDENT_INFO_VARIANT":
      return { ...state, studentInfoVariant: action.payload }
    case "SET_INSTRUCTIONS_VARIANT":
      return { ...state, instructionsVariant: action.payload }
    case "SET_ANSWER_SHEET_VARIANT":
      return { ...state, answerSheetVariant: action.payload }
    case "SET_COVER_VARIANT":
      return { ...state, coverVariant: action.payload }
    case "SET_QUESTION_TYPES":
      return { ...state, questionTypes: action.payload }
    case "SET_PRESET":
      return { ...state, selectedPresetId: action.payload }
    case "APPLY_PRESET":
      return {
        ...state,
        headerVariant: action.payload.slots.header || state.headerVariant,
        footerVariant: action.payload.slots.footer || state.footerVariant,
        studentInfoVariant:
          action.payload.slots.studentInfo || state.studentInfoVariant,
        instructionsVariant:
          action.payload.slots.instructions || state.instructionsVariant,
        answerSheetVariant:
          action.payload.slots.answerSheet || state.answerSheetVariant,
        coverVariant: action.payload.slots.cover || state.coverVariant,
        decorations: action.payload.decorations,
      }
    case "SET_DECORATIONS":
      return { ...state, decorations: action.payload }
    case "SET_PRINT_CONFIG":
      return { ...state, ...action.payload }
    case "SET_SCORING":
      return { ...state, ...action.payload }
    case "SET_STEP":
      return { ...state, currentStep: action.payload }
    case "NEXT_STEP":
      return { ...state, currentStep: state.currentStep + 1 }
    case "PREV_STEP":
      return { ...state, currentStep: Math.max(0, state.currentStep - 1) }
    case "LOAD_STATE":
      return { ...action.payload }
    default:
      return state
  }
}

const STORAGE_KEY_PREFIX = "wizard-template-"

export function useWizardState(schoolId: string) {
  const storageKey = `${STORAGE_KEY_PREFIX}${schoolId}`

  const [state, dispatch] = useReducer(wizardReducer, INITIAL_STATE)

  // Persist state to localStorage on change
  useEffect(() => {
    if (state !== INITIAL_STATE) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(state))
      } catch {
        // Silently fail if localStorage is unavailable
      }
    }
  }, [state, storageKey])

  // Load saved draft on mount
  const loadDraft = useCallback(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved) as TemplateWizardState
        dispatch({ type: "LOAD_STATE", payload: parsed })
        return true
      }
    } catch {
      // Silently fail
    }
    return false
  }, [storageKey])

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey)
    } catch {
      // Silently fail
    }
  }, [storageKey])

  return { state, dispatch, loadDraft, clearDraft }
}
