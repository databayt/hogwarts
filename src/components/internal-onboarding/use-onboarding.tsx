"use client"

import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

import type { OnboardingRole, OnboardingStep } from "./config"
import type {
  ApplicationAutoFillData,
  OnboardingFormData,
  OnboardingState,
} from "./types"

// =============================================================================
// CONTEXT
// =============================================================================

interface OnboardingContextType {
  state: OnboardingState
  schoolId: string
  subdomain: string

  // Role
  setRole: (role: OnboardingRole) => void

  // Form data
  updateStepData: <K extends keyof OnboardingFormData>(
    step: K,
    data: OnboardingFormData[K]
  ) => void
  getStepData: <K extends keyof OnboardingFormData>(
    step: K
  ) => OnboardingFormData[K] | undefined

  // Auto-fill
  setAutoFillData: (data: ApplicationAutoFillData) => void

  // Navigation
  setCurrentStep: (step: OnboardingStep) => void

  // Error
  clearError: () => void
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined
)

export function useOnboarding(): OnboardingContextType {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider")
  }
  return context
}

// =============================================================================
// PROVIDER
// =============================================================================

interface OnboardingProviderProps {
  children: ReactNode
  schoolId: string
  subdomain: string
}

const STORAGE_KEY_PREFIX = "internal_onboarding_draft_"

export function OnboardingProvider({
  children,
  schoolId,
  subdomain,
}: OnboardingProviderProps) {
  const storageKey = `${STORAGE_KEY_PREFIX}${schoolId}`

  const [state, setState] = useState<OnboardingState>(() => {
    // Try to restore from localStorage
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(storageKey)
        if (stored) {
          const parsed = JSON.parse(stored)
          return {
            role: parsed.role || null,
            currentStep: parsed.currentStep || "personal",
            formData: parsed.formData || {},
            applicationData: parsed.applicationData || null,
            isLoading: false,
            error: null,
          }
        }
      } catch {
        // Ignore parse errors
      }
    }
    return {
      role: null,
      currentStep: "personal",
      formData: {},
      applicationData: null,
      isLoading: false,
      error: null,
    }
  })

  // Persist to localStorage on state changes
  useEffect(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          role: state.role,
          currentStep: state.currentStep,
          formData: state.formData,
          applicationData: state.applicationData,
        })
      )
    } catch {
      // Ignore storage errors
    }
  }, [
    storageKey,
    state.role,
    state.currentStep,
    state.formData,
    state.applicationData,
  ])

  const setRole = useCallback((role: OnboardingRole) => {
    setState((prev) => ({ ...prev, role }))
  }, [])

  const updateStepData = useCallback(
    <K extends keyof OnboardingFormData>(
      step: K,
      data: OnboardingFormData[K]
    ) => {
      setState((prev) => ({
        ...prev,
        formData: { ...prev.formData, [step]: data },
      }))
    },
    []
  )

  const getStepData = useCallback(
    <K extends keyof OnboardingFormData>(
      step: K
    ): OnboardingFormData[K] | undefined => {
      return state.formData[step]
    },
    [state.formData]
  )

  const setAutoFillData = useCallback((data: ApplicationAutoFillData) => {
    setState((prev) => ({ ...prev, applicationData: data }))
  }, [])

  const setCurrentStep = useCallback((step: OnboardingStep) => {
    setState((prev) => ({ ...prev, currentStep: step }))
  }, [])

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }))
  }, [])

  const value = useMemo(
    () => ({
      state,
      schoolId,
      subdomain,
      setRole,
      updateStepData,
      getStepData,
      setAutoFillData,
      setCurrentStep,
      clearError,
    }),
    [
      state,
      schoolId,
      subdomain,
      setRole,
      updateStepData,
      getStepData,
      setAutoFillData,
      setCurrentStep,
      clearError,
    ]
  )

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  )
}
