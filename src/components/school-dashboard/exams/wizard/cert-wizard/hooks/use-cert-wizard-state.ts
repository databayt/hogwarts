// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { useCallback, useEffect, useReducer } from "react"

import {
  CERT_INITIAL_STATE,
  type CertWizardAction,
  type CertWizardState,
} from "../types"

function certWizardReducer(
  state: CertWizardState,
  action: CertWizardAction
): CertWizardState {
  switch (action.type) {
    case "SET_INFO":
      return { ...state, ...action.payload }
    case "SET_PRESET":
      return { ...state, selectedPresetId: action.payload }
    case "APPLY_PRESET":
      return {
        ...state,
        headerVariant: action.payload.slots.header || state.headerVariant,
        titleVariant: action.payload.slots.title || state.titleVariant,
        recipientVariant:
          action.payload.slots.recipient || state.recipientVariant,
        bodyVariant: action.payload.slots.body || state.bodyVariant,
        scoresVariant: action.payload.slots.scores || state.scoresVariant,
        signaturesVariant:
          action.payload.slots.signatures || state.signaturesVariant,
        footerVariant: action.payload.slots.footer || state.footerVariant,
        decorations: action.payload.decorations,
      }
    case "SET_HEADER_VARIANT":
      return { ...state, headerVariant: action.payload }
    case "SET_TITLE_VARIANT":
      return { ...state, titleVariant: action.payload }
    case "SET_RECIPIENT_VARIANT":
      return { ...state, recipientVariant: action.payload }
    case "SET_BODY_VARIANT":
      return { ...state, bodyVariant: action.payload }
    case "SET_SCORES_VARIANT":
      return { ...state, scoresVariant: action.payload }
    case "SET_SIGNATURES_VARIANT":
      return { ...state, signaturesVariant: action.payload }
    case "SET_FOOTER_VARIANT":
      return { ...state, footerVariant: action.payload }
    case "SET_DECORATIONS":
      return { ...state, decorations: action.payload }
    case "SET_PRINT_CONFIG":
      return { ...state, ...action.payload }
    case "SET_SIGNATURES_DATA":
      return { ...state, signatures: action.payload }
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

const STORAGE_KEY_PREFIX = "cert-wizard-"

export function useCertWizardState(schoolId: string) {
  const storageKey = `${STORAGE_KEY_PREFIX}${schoolId}`

  const [state, dispatch] = useReducer(certWizardReducer, CERT_INITIAL_STATE)

  // Persist state to localStorage on change
  useEffect(() => {
    if (state !== CERT_INITIAL_STATE) {
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
        const parsed = JSON.parse(saved) as CertWizardState
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
