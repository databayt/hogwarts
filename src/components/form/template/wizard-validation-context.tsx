"use client"

import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"

// =============================================================================
// TYPES
// =============================================================================

export type WizardFlowType = "linear" | "dependency"

export interface CustomNavigation {
  onBack?: () => void
  onNext?: () => void
  nextDisabled?: boolean
}

export interface WizardValidationContextType {
  // Core validation state
  isNextDisabled: boolean
  setIsNextDisabled: (disabled: boolean) => void
  enableNext: () => void
  disableNext: () => void

  // Custom navigation handlers
  customNavigation?: CustomNavigation
  setCustomNavigation: (navigation?: CustomNavigation) => void

  // Flow type (for consumer information)
  flowType: WizardFlowType

  // Dependency-based flow support (optional)
  dependencies?: Record<string, string[]>
  completedSteps: Set<string>
  canNavigateTo: (stepId: string) => boolean
  markStepComplete: (stepId: string) => void
  markStepIncomplete: (stepId: string) => void
}

// =============================================================================
// CONTEXT
// =============================================================================

const WizardValidationContext = createContext<
  WizardValidationContextType | undefined
>(undefined)

// =============================================================================
// HOOK
// =============================================================================

export function useWizardValidation(): WizardValidationContextType {
  const context = useContext(WizardValidationContext)
  if (!context) {
    throw new Error(
      "useWizardValidation must be used within a WizardValidationProvider"
    )
  }
  return context
}

/**
 * Optional hook that returns undefined if not within provider
 * Useful for components that may be used outside wizard context
 */
export function useWizardValidationOptional():
  | WizardValidationContextType
  | undefined {
  return useContext(WizardValidationContext)
}

// =============================================================================
// PROVIDER
// =============================================================================

interface WizardValidationProviderProps {
  children: ReactNode
  /** Flow type: "linear" (sequential) or "dependency" (with step gates) */
  flowType?: WizardFlowType
  /** Step dependencies map (only for dependency flows) */
  dependencies?: Record<string, string[]>
  /** Initially completed steps (only for dependency flows) */
  initialCompletedSteps?: string[]
}

export function WizardValidationProvider({
  children,
  flowType = "linear",
  dependencies,
  initialCompletedSteps = [],
}: WizardValidationProviderProps) {
  // Core validation state - default to disabled (pages must explicitly enable)
  const [isNextDisabled, setIsNextDisabled] = useState(true)
  const [customNavigation, setCustomNavigation] = useState<
    CustomNavigation | undefined
  >(undefined)

  // Dependency flow state
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(
    () => new Set(initialCompletedSteps)
  )

  // Navigation controls
  const enableNext = useCallback(() => {
    setIsNextDisabled(false)
  }, [])

  const disableNext = useCallback(() => {
    setIsNextDisabled(true)
  }, [])

  // Step completion controls
  const markStepComplete = useCallback((stepId: string) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev)
      next.add(stepId)
      return next
    })
  }, [])

  const markStepIncomplete = useCallback((stepId: string) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev)
      next.delete(stepId)
      return next
    })
  }, [])

  // Check if navigation to a step is allowed
  const canNavigateTo = useCallback(
    (stepId: string): boolean => {
      // Linear flows always allow navigation
      if (flowType === "linear") return true

      // No dependencies defined = allow all
      if (!dependencies) return true

      // Check if all dependencies are completed
      const stepDeps = dependencies[stepId]
      if (!stepDeps || stepDeps.length === 0) return true

      return stepDeps.every((dep) => completedSteps.has(dep))
    },
    [flowType, dependencies, completedSteps]
  )

  // Context value
  const value: WizardValidationContextType = useMemo(
    () => ({
      isNextDisabled,
      setIsNextDisabled,
      enableNext,
      disableNext,
      customNavigation,
      setCustomNavigation,
      flowType,
      dependencies,
      completedSteps,
      canNavigateTo,
      markStepComplete,
      markStepIncomplete,
    }),
    [
      isNextDisabled,
      enableNext,
      disableNext,
      customNavigation,
      flowType,
      dependencies,
      completedSteps,
      canNavigateTo,
      markStepComplete,
      markStepIncomplete,
    ]
  )

  return (
    <WizardValidationContext.Provider value={value}>
      {children}
    </WizardValidationContext.Provider>
  )
}

// =============================================================================
// BACKWARD COMPATIBILITY ALIASES
// =============================================================================

/** @deprecated Use WizardValidationProvider instead */
export const HostValidationProvider = WizardValidationProvider

/** @deprecated Use useWizardValidation instead */
export const useHostValidation = useWizardValidation

/** @deprecated Use WizardValidationProvider instead */
export const ApplyValidationProvider = WizardValidationProvider

/** @deprecated Use useWizardValidation instead */
export const useApplyValidation = useWizardValidation
