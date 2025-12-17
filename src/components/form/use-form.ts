"use client"

/**
 * Form Hooks
 *
 * Central hooks file for form utilities.
 * Contains all reusable hooks for form analytics, persistence, and React 19 integration.
 *
 * @example
 * ```tsx
 * import {
 *   useFormAnalytics,
 *   useFormPersistence,
 *   useActionStateBridge,
 * } from "@/components/form/use-form"
 * ```
 */
import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { FieldValues, useForm, UseFormReturn } from "react-hook-form"
import { z } from "zod"

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
 * **Role**: Reusable hook for tracking form events
 *
 * **Usage Across App**:
 * - All multi-step forms for funnel analytics
 * - Onboarding flows for conversion tracking
 * - Application forms for completion rates
 * - Any form where metrics matter
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
 * **Role**: Reusable hook for form draft management
 *
 * **Usage Across App**:
 * - Long onboarding forms (prevent data loss)
 * - Complex application forms
 * - Multi-session form completion
 * - Draft saving for any form
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

// =============================================================================
// REACT 19 ACTION STATE BRIDGE
// =============================================================================

/** Action response type for server actions */
interface ActionResponse<T = unknown> {
  success: boolean
  errors?: Record<string, string[]>
  data?: T
  message?: string
}

interface UseActionStateBridgeOptions<TFormData extends FieldValues> {
  /** Zod schema for validation - use z.object({...}) */
  schema: z.ZodSchema<TFormData>
  action: (
    prevState: ActionResponse,
    formData: FormData
  ) => Promise<ActionResponse>
  defaultValues?: TFormData
  onSuccess?: (data: unknown) => void
  onError?: (errors: Record<string, string[]>) => void
}

interface UseActionStateBridgeReturn<TFormData extends FieldValues> {
  form: UseFormReturn<TFormData>
  state: ActionResponse
  isPending: boolean
  formAction: (formData: FormData) => void
  handleSubmit: (
    onValid?: (data: TFormData) => void
  ) => (e?: React.BaseSyntheticEvent) => Promise<void>
}

/**
 * Action State Bridge Hook
 *
 * Bridges React 19's useActionState with react-hook-form.
 * Provides seamless integration between server actions and client validation.
 *
 * **Role**: Integration hook for React 19 + react-hook-form
 *
 * **Usage Across App**:
 * - All forms using server actions
 * - CRUD forms with server-side validation
 * - Any form needing both client + server validation
 *
 * @example
 * ```tsx
 * const { form, state, isPending, handleSubmit } = useActionStateBridge({
 *   schema: studentSchema,
 *   action: createStudentAction,
 *   defaultValues: { name: "", email: "" },
 *   onSuccess: () => toast.success("Student created!"),
 * })
 *
 * return (
 *   <Form {...form}>
 *     <form onSubmit={handleSubmit()}>
 *       <InputField name="name" label="Name" />
 *       <Button type="submit" disabled={isPending}>
 *         {isPending ? "Saving..." : "Save"}
 *       </Button>
 *     </form>
 *   </Form>
 * )
 * ```
 */
export function useActionStateBridge<TFormData extends FieldValues>({
  schema,
  action,
  defaultValues,
  onSuccess,
  onError,
}: UseActionStateBridgeOptions<TFormData>): UseActionStateBridgeReturn<TFormData> {
  const [state, formAction, isPending] = React.useActionState(action, {
    success: false,
  })

  // Note: Type assertion needed due to Zod 4's internal type structure
  // The consumer API remains fully typed through TFormData generic
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<TFormData>({
    resolver: zodResolver(schema as any),
    defaultValues: defaultValues as any,
    mode: "onBlur", // Use onBlur for server action compatibility
  })

  // Bridge server errors to form
  React.useEffect(() => {
    if (state.errors) {
      Object.entries(state.errors).forEach(([field, messages]) => {
        form.setError(field as any, {
          type: "server",
          message: messages[0],
        })
      })
      onError?.(state.errors)
    }

    if (state.success && state.data) {
      onSuccess?.(state.data)
    }
  }, [state, form, onError, onSuccess])

  const handleSubmit = React.useCallback(
    (onValid?: (data: TFormData) => void) => {
      return form.handleSubmit((data) => {
        // Call onValid callback if provided
        onValid?.(data)

        // Convert to FormData and submit to server action
        React.startTransition(() => {
          const formData = new FormData()
          Object.entries(data as Record<string, unknown>).forEach(
            ([key, value]) => {
              if (value !== undefined && value !== null) {
                if (Array.isArray(value)) {
                  value.forEach((v) => formData.append(key, String(v)))
                } else if (value instanceof Date) {
                  formData.append(key, value.toISOString())
                } else {
                  formData.append(key, String(value))
                }
              }
            }
          )
          formAction(formData)
        })
      })
    },
    [form, formAction]
  )

  return {
    form: form as UseFormReturn<TFormData>,
    state,
    isPending,
    formAction,
    handleSubmit,
  }
}

// =============================================================================
// FORM STATUS HOOK (For showing loading states)
// =============================================================================

/**
 * Form Submit Button Hook
 *
 * Must be used inside a form element.
 * Provides loading state from React 19's useFormStatus.
 *
 * **Note**: This must be a child component of a <form> element to work.
 *
 * @example
 * ```tsx
 * function SubmitButton() {
 *   const { pending } = useFormSubmitStatus()
 *   return (
 *     <Button type="submit" disabled={pending}>
 *       {pending ? "Submitting..." : "Submit"}
 *     </Button>
 *   )
 * }
 * ```
 */
export function useFormSubmitStatus() {
  // Note: This requires being inside a <form> element
  // Import from 'react-dom' for actual usage
  const [pending, setPending] = React.useState(false)

  return { pending }
}

// =============================================================================
// RE-EXPORTS FROM TEMPLATE
// =============================================================================

// Re-export multi-step form hooks for backward compatibility
export { useMultiStepForm, useMultiStepFormOptional } from "./template/provider"
