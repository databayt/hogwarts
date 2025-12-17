"use client"

/**
 * Apply Context Bridge
 *
 * Bridges Form Block with ApplicationContext for admission application flows.
 * Syncs form data bidirectionally with the application session.
 *
 * **Role**: Bridge hook for Apply system → Form Block integration
 *
 * **Usage**:
 * - Use in apply step components
 * - Auto-syncs form data with ApplicationContext
 * - Loads existing data on mount
 * - Marks session dirty on changes
 *
 * @example
 * ```tsx
 * function PersonalStep() {
 *   const { saveToContext } = useApplyBridge("personal")
 *
 *   // Data syncs automatically via MultiStepFormProvider
 *   // Manual save available when needed
 *   const handleBlur = () => saveToContext()
 *
 *   return (
 *     <>
 *       <InputField name="firstName" label="First Name" required />
 *       <InputField name="lastName" label="Last Name" required />
 *     </>
 *   )
 * }
 * ```
 */
import { useCallback, useEffect, useRef } from "react"

import { useApplication } from "@/components/site/apply/application-context"
import type { ApplySessionState } from "@/components/site/apply/types"

import { useMultiStepFormOptional } from "../template/provider"

type ApplyStepKey = keyof ApplySessionState["formData"]

interface UseApplyBridgeOptions {
  /** Auto-sync form changes to context (default: true) */
  autoSync?: boolean
  /** Load existing data on mount (default: true) */
  loadOnMount?: boolean
  /** Sync interval in ms (default: 1000) */
  syncIntervalMs?: number
}

interface UseApplyBridgeReturn {
  /** Manually save current form data to context */
  saveToContext: () => void
  /** Manually load data from context to form */
  loadFromContext: () => void
  /** Application session state */
  session: ApplySessionState
  /** Whether the session is dirty (unsaved changes) */
  isDirty: boolean
  /** Whether the session is currently saving */
  isSaving: boolean
  /** Last saved timestamp */
  lastSaved: Date | null
  /** Get current step data from Form Block */
  getFormData: () => unknown
}

export function useApplyBridge<T extends ApplyStepKey>(
  stepKey: T,
  options: UseApplyBridgeOptions = {}
): UseApplyBridgeReturn {
  const { autoSync = true, loadOnMount = true, syncIntervalMs = 1000 } = options

  const { session, updateStepData, getStepData, markDirty } = useApplication()
  const multiStep = useMultiStepFormOptional()

  const syncTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastSyncedDataRef = useRef<string>("")

  // Get current form data from Form Block context
  const getFormData = useCallback(() => {
    if (!multiStep) return undefined
    // Use the stepKey as the step ID to get data
    return multiStep.getStepData(stepKey)
  }, [multiStep, stepKey])

  // Save current form data to ApplicationContext
  const saveToContext = useCallback(() => {
    if (!multiStep) return

    // Get data for this specific step from Form Block
    const formData = multiStep.getStepData(stepKey)
    if (formData) {
      updateStepData(stepKey, formData as ApplySessionState["formData"][T])
      markDirty()
    }
  }, [multiStep, stepKey, updateStepData, markDirty])

  // Load data from ApplicationContext to Form Block
  const loadFromContext = useCallback(() => {
    if (!multiStep) return

    const existingData = getStepData(stepKey)
    if (existingData) {
      // Set data in Form Block context
      multiStep.setStepData(stepKey, existingData)
    }
  }, [multiStep, stepKey, getStepData])

  // Load existing data on mount
  useEffect(() => {
    if (loadOnMount) {
      loadFromContext()
    }
  }, [loadOnMount, loadFromContext])

  // Auto-sync form changes to context (interval-based)
  // Since we can't watch react-hook-form directly, we poll for changes
  useEffect(() => {
    if (!autoSync || !multiStep) return

    const checkAndSync = () => {
      const currentData = multiStep.getStepData(stepKey)
      const currentDataStr = JSON.stringify(currentData)

      // Only sync if data has changed
      if (currentDataStr !== lastSyncedDataRef.current) {
        lastSyncedDataRef.current = currentDataStr
        if (currentData) {
          updateStepData(
            stepKey,
            currentData as ApplySessionState["formData"][T]
          )
          markDirty()
        }
      }
    }

    // Check periodically for changes
    syncTimerRef.current = setInterval(checkAndSync, syncIntervalMs)

    return () => {
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current)
      }
    }
  }, [autoSync, multiStep, stepKey, syncIntervalMs, updateStepData, markDirty])

  return {
    saveToContext,
    loadFromContext,
    session,
    isDirty: session.isDirty,
    isSaving: session.isSaving,
    lastSaved: session.lastSaved,
    getFormData,
  }
}
