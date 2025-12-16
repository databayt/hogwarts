"use client"

import * as React from "react"

import type { FormAnalytics, FormFlowType } from "./types"

// =============================================================================
// ANALYTICS HOOK
// =============================================================================

/**
 * Form Analytics Hook
 *
 * Provides analytics tracking for form flows.
 * Integrates with Vercel Analytics and PostHog.
 *
 * @example
 * ```tsx
 * const analytics = useFormAnalytics()
 *
 * useEffect(() => {
 *   analytics.trackStepView("newcomers", "role-selection")
 * }, [])
 *
 * const handleNext = async () => {
 *   analytics.trackStepComplete("newcomers", "role-selection", duration)
 * }
 * ```
 */
export function useFormAnalytics(): FormAnalytics {
  const stepStartTimeRef = React.useRef<Record<string, number>>({})

  const trackStepView = React.useCallback(
    (flowType: FormFlowType, stepId: string) => {
      stepStartTimeRef.current[stepId] = Date.now()

      if (typeof window !== "undefined" && (window as any).va) {
        ;(window as any).va("event", {
          name: "form_step_view",
          data: { flowType, stepId },
        })
      }

      if (typeof window !== "undefined" && (window as any).posthog) {
        ;(window as any).posthog.capture("form_step_view", {
          flowType,
          stepId,
        })
      }

      if (process.env.NODE_ENV === "development") {
        console.log("[Form Analytics] Step View:", { flowType, stepId })
      }
    },
    []
  )

  const trackStepComplete = React.useCallback(
    (flowType: FormFlowType, stepId: string, duration?: number) => {
      const calculatedDuration =
        duration ??
        (stepStartTimeRef.current[stepId]
          ? Date.now() - stepStartTimeRef.current[stepId]
          : undefined)

      if (typeof window !== "undefined" && (window as any).va) {
        ;(window as any).va("event", {
          name: "form_step_complete",
          data: { flowType, stepId, duration: calculatedDuration },
        })
      }

      if (typeof window !== "undefined" && (window as any).posthog) {
        ;(window as any).posthog.capture("form_step_complete", {
          flowType,
          stepId,
          duration: calculatedDuration,
        })
      }

      if (process.env.NODE_ENV === "development") {
        console.log("[Form Analytics] Step Complete:", {
          flowType,
          stepId,
          duration: calculatedDuration,
        })
      }
    },
    []
  )

  const trackStepError = React.useCallback(
    (flowType: FormFlowType, stepId: string, errorType: string) => {
      if (typeof window !== "undefined" && (window as any).va) {
        ;(window as any).va("event", {
          name: "form_step_error",
          data: { flowType, stepId, errorType },
        })
      }

      if (typeof window !== "undefined" && (window as any).posthog) {
        ;(window as any).posthog.capture("form_step_error", {
          flowType,
          stepId,
          errorType,
        })
      }

      if (process.env.NODE_ENV === "development") {
        console.log("[Form Analytics] Step Error:", {
          flowType,
          stepId,
          errorType,
        })
      }
    },
    []
  )

  const trackFlowComplete = React.useCallback(
    (flowType: FormFlowType, data?: Record<string, unknown>) => {
      if (typeof window !== "undefined" && (window as any).va) {
        ;(window as any).va("event", {
          name: "form_flow_complete",
          data: { flowType },
        })
      }

      if (typeof window !== "undefined" && (window as any).posthog) {
        ;(window as any).posthog.capture("form_flow_complete", {
          flowType,
          ...data,
        })
      }

      if (process.env.NODE_ENV === "development") {
        console.log("[Form Analytics] Flow Complete:", { flowType, data })
      }
    },
    []
  )

  const trackFlowAbandonment = React.useCallback(
    (flowType: FormFlowType, lastStepId: string) => {
      if (typeof window !== "undefined" && (window as any).va) {
        ;(window as any).va("event", {
          name: "form_flow_abandon",
          data: { flowType, lastStepId },
        })
      }

      if (typeof window !== "undefined" && (window as any).posthog) {
        ;(window as any).posthog.capture("form_flow_abandon", {
          flowType,
          lastStepId,
        })
      }

      if (process.env.NODE_ENV === "development") {
        console.log("[Form Analytics] Flow Abandoned:", {
          flowType,
          lastStepId,
        })
      }
    },
    []
  )

  return {
    trackStepView,
    trackStepComplete,
    trackStepError,
    trackFlowComplete,
    trackFlowAbandonment,
  }
}

// =============================================================================
// PERSISTENCE HOOK
// =============================================================================

interface FormPersistenceOptions {
  key: string
  autoSave?: boolean
  autoSaveInterval?: number
}

interface FormPersistenceReturn<T> {
  data: T | null
  save: (data: T) => void
  load: () => T | null
  clear: () => void
  isDirty: boolean
  lastSaved: Date | null
}

/**
 * Form Persistence Hook
 *
 * Provides localStorage persistence for form data.
 * Useful for saving drafts and resuming forms.
 *
 * @example
 * ```tsx
 * const persistence = useFormPersistence<FormData>({
 *   key: "onboarding-draft",
 *   autoSave: true,
 *   autoSaveInterval: 30000,
 * })
 *
 * useEffect(() => {
 *   const draft = persistence.load()
 *   if (draft) form.reset(draft)
 * }, [])
 * ```
 */
export function useFormPersistence<T>({
  key,
  autoSave = false,
  autoSaveInterval = 30000,
}: FormPersistenceOptions): FormPersistenceReturn<T> {
  const [data, setData] = React.useState<T | null>(null)
  const [isDirty, setIsDirty] = React.useState(false)
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null)
  const autoSaveTimerRef = React.useRef<NodeJS.Timeout | null>(null)

  const load = React.useCallback((): T | null => {
    if (typeof window === "undefined") return null

    try {
      const stored = localStorage.getItem(key)
      if (!stored) return null

      const parsed = JSON.parse(stored) as {
        data: T
        savedAt: string
      }

      setData(parsed.data)
      setLastSaved(new Date(parsed.savedAt))
      setIsDirty(false)

      return parsed.data
    } catch (error) {
      console.error("[Form Persistence] Failed to load:", error)
      return null
    }
  }, [key])

  const save = React.useCallback(
    (newData: T) => {
      if (typeof window === "undefined") return

      try {
        const payload = {
          data: newData,
          savedAt: new Date().toISOString(),
        }

        localStorage.setItem(key, JSON.stringify(payload))
        setData(newData)
        setLastSaved(new Date())
        setIsDirty(false)
      } catch (error) {
        console.error("[Form Persistence] Failed to save:", error)
      }
    },
    [key]
  )

  const clear = React.useCallback(() => {
    if (typeof window === "undefined") return

    localStorage.removeItem(key)
    setData(null)
    setLastSaved(null)
    setIsDirty(false)
  }, [key])

  React.useEffect(() => {
    if (!autoSave || !isDirty || !data) return

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    autoSaveTimerRef.current = setTimeout(() => {
      save(data)
    }, autoSaveInterval)

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [autoSave, autoSaveInterval, isDirty, data, save])

  return {
    data,
    save,
    load,
    clear,
    isDirty,
    lastSaved,
  }
}
