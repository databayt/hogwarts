"use client"

/**
 * Host Validation Bridge
 *
 * Bridges Form Block with HostValidationContext for onboarding flows.
 * Syncs form validation state with the host navigation system.
 *
 * **Role**: Bridge hook for onboarding → Form Block integration
 *
 * **Usage**:
 * - Use in onboarding step components
 * - Auto-syncs form validity with enableNext/disableNext
 * - Provides custom navigation handlers
 *
 * @example
 * ```tsx
 * function TitleStep() {
 *   const { syncValidation } = useHostBridge()
 *
 *   // Manual sync when needed
 *   useEffect(() => {
 *     syncValidation(isValid)
 *   }, [isValid])
 *
 *   return <InputField name="title" ... />
 * }
 * ```
 */
import { useCallback, useEffect } from "react"

import { useHostValidation } from "@/components/onboarding/host-validation-context"

import { useMultiStepFormOptional } from "../template/provider"

interface UseHostBridgeOptions {
  /** Step ID to check validation for */
  stepId?: string
  /** Sync validation state automatically (default: true) */
  autoSync?: boolean
  /** Custom validation function (overrides form validation) */
  customValidation?: () => boolean
}

interface UseHostBridgeReturn {
  /** Manually sync validation state */
  syncValidation: (isValid: boolean) => void
  /** Set custom navigation handlers */
  setNavigation: (handlers: {
    onNext?: () => void | Promise<void>
    onBack?: () => void
  }) => void
  /** Enable the next button */
  enableNext: () => void
  /** Disable the next button */
  disableNext: () => void
  /** Whether next is currently disabled */
  isNextDisabled: boolean
}

export function useHostBridge(
  options: UseHostBridgeOptions = {}
): UseHostBridgeReturn {
  const { stepId, autoSync = true, customValidation } = options

  const hostValidation = useHostValidation()
  const multiStep = useMultiStepFormOptional()

  const { enableNext, disableNext, setCustomNavigation, isNextDisabled } =
    hostValidation

  // Sync validation state
  const syncValidation = useCallback(
    (isValid: boolean) => {
      if (isValid) {
        enableNext()
      } else {
        disableNext()
      }
    },
    [enableNext, disableNext]
  )

  // Auto-sync with Form Block validation state
  useEffect(() => {
    if (!autoSync) return

    // Use custom validation if provided
    if (customValidation) {
      syncValidation(customValidation())
      return
    }

    // Otherwise sync with Form Block state
    if (multiStep && stepId) {
      const isValid = multiStep.isStepValid(stepId)
      syncValidation(isValid)
    }
  }, [autoSync, customValidation, multiStep, stepId, syncValidation])

  // Set custom navigation handlers
  const setNavigation = useCallback(
    (handlers: {
      onNext?: () => void | Promise<void>
      onBack?: () => void
    }) => {
      setCustomNavigation({
        onNext: handlers.onNext,
        onBack: handlers.onBack,
      })
    },
    [setCustomNavigation]
  )

  return {
    syncValidation,
    setNavigation,
    enableNext,
    disableNext,
    isNextDisabled,
  }
}
