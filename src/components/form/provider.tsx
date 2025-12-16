"use client"

import * as React from "react"

import type {
  FormStep,
  MultiStepFormConfig,
  MultiStepFormContextValue,
  MultiStepFormProviderProps,
} from "./types"

const MultiStepFormContext =
  React.createContext<MultiStepFormContextValue | null>(null)

/**
 * Multi-Step Form Provider
 *
 * Provides state management for multi-step forms with:
 * - Step navigation and validation
 * - Form data persistence across steps
 * - Auto-save support with localStorage
 * - Draft loading/saving
 * - Analytics integration
 *
 * @example
 * ```tsx
 * <MultiStepFormProvider
 *   config={formConfig}
 *   onSubmit={handleSubmit}
 *   onStepChange={(stepId, direction) => console.log(stepId, direction)}
 * >
 *   {currentStep === 0 && <PersonalInfoStep />}
 *   {currentStep === 1 && <ContactStep />}
 *   {currentStep === 2 && <ReviewStep />}
 * </MultiStepFormProvider>
 * ```
 */
export function MultiStepFormProvider({
  config,
  onSubmit,
  onStepChange,
  onError,
  initialData = {},
  children,
}: MultiStepFormProviderProps) {
  const [currentStep, setCurrentStep] = React.useState(0)
  const [completedSteps, setCompletedSteps] = React.useState<Set<string>>(
    new Set()
  )
  const [formData, setFormData] =
    React.useState<Record<string, unknown>>(initialData)
  const [isDirty, setIsDirty] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string[]>>({})

  const autoSaveTimerRef = React.useRef<NodeJS.Timeout | null>(null)

  // Derived values
  const totalSteps = config.steps.length
  const currentStepConfig = config.steps[currentStep] as FormStep
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === totalSteps - 1
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0

  // Auto-save effect
  React.useEffect(() => {
    if (!config.autoSave || !config.persistenceKey || !isDirty) return

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    const interval = config.autoSaveInterval || 30000

    autoSaveTimerRef.current = setTimeout(() => {
      saveDraft()
    }, interval)

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [formData, isDirty, config.autoSave, config.persistenceKey])

  // Validate current step
  const validateCurrentStep = React.useCallback(async (): Promise<boolean> => {
    const stepId = currentStepConfig.id
    const schema = config.validation?.[stepId]

    if (!schema) return true

    const stepData = formData[stepId] || {}

    try {
      await schema.parseAsync(stepData)
      setErrors((prev) => {
        const next = { ...prev }
        delete next[stepId]
        return next
      })
      return true
    } catch (error) {
      if (error instanceof Error && "errors" in error) {
        const zodErrors = (error as { errors: Array<{ message: string }> })
          .errors
        const messages = zodErrors.map((e) => e.message)
        setErrors((prev) => ({ ...prev, [stepId]: messages }))
        onError?.(stepId, messages)
      }
      return false
    }
  }, [currentStepConfig.id, config.validation, formData, onError])

  // Check if a step is valid
  const isStepValid = React.useCallback(
    (stepId: string): boolean => {
      return !errors[stepId] || errors[stepId].length === 0
    },
    [errors]
  )

  // Check if navigation to step is allowed
  const canNavigateTo = React.useCallback(
    (stepId: string): boolean => {
      const targetIndex = config.steps.findIndex((s) => s.id === stepId)
      if (targetIndex === -1) return false

      // Can always go back
      if (targetIndex < currentStep) return true

      // Can go forward only if all previous steps are completed
      for (let i = 0; i < targetIndex; i++) {
        const step = config.steps[i]
        if (!step?.optional && !completedSteps.has(step?.id || "")) {
          return false
        }
      }

      return true
    },
    [config.steps, currentStep, completedSteps]
  )

  // Navigate to next step
  const next = React.useCallback(async (): Promise<boolean> => {
    const isValid = await validateCurrentStep()

    if (!isValid) return false

    // Mark current step as completed
    setCompletedSteps((prev) => new Set([...prev, currentStepConfig.id]))

    if (isLastStep) {
      // Submit the form
      setIsSubmitting(true)
      try {
        await onSubmit(formData)
        return true
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Submission failed"
        setErrors((prev) => ({
          ...prev,
          [currentStepConfig.id]: [message],
        }))
        return false
      } finally {
        setIsSubmitting(false)
      }
    }

    // Move to next step
    const nextStep = currentStep + 1
    setCurrentStep(nextStep)
    onStepChange?.(config.steps[nextStep]?.id || "", "next")

    return true
  }, [
    validateCurrentStep,
    currentStepConfig.id,
    isLastStep,
    currentStep,
    formData,
    onSubmit,
    onStepChange,
    config.steps,
  ])

  // Navigate to previous step
  const back = React.useCallback(() => {
    if (isFirstStep) return

    const prevStep = currentStep - 1
    setCurrentStep(prevStep)
    onStepChange?.(config.steps[prevStep]?.id || "", "back")
  }, [isFirstStep, currentStep, onStepChange, config.steps])

  // Navigate to specific step
  const goTo = React.useCallback(
    (stepId: string): boolean => {
      if (!canNavigateTo(stepId)) return false

      const targetIndex = config.steps.findIndex((s) => s.id === stepId)
      if (targetIndex === -1) return false

      const direction = targetIndex > currentStep ? "next" : "back"
      setCurrentStep(targetIndex)
      onStepChange?.(stepId, direction)

      return true
    },
    [canNavigateTo, config.steps, currentStep, onStepChange]
  )

  // Get step data
  const getStepData = React.useCallback(
    <T,>(stepId: string): T | undefined => {
      return formData[stepId] as T | undefined
    },
    [formData]
  )

  // Set step data
  const setStepData = React.useCallback(
    (stepId: string, data: unknown) => {
      setFormData((prev) => ({ ...prev, [stepId]: data }))
      setIsDirty(true)

      // Clear errors when data changes
      if (errors[stepId]) {
        setErrors((prev) => {
          const next = { ...prev }
          delete next[stepId]
          return next
        })
      }
    },
    [errors]
  )

  // Get all form data
  const getAllData = React.useCallback(() => formData, [formData])

  // Set step error
  const setStepError = React.useCallback(
    (stepId: string, stepErrors: string[]) => {
      setErrors((prev) => ({ ...prev, [stepId]: stepErrors }))
    },
    []
  )

  // Clear step error
  const clearStepError = React.useCallback((stepId: string) => {
    setErrors((prev) => {
      const next = { ...prev }
      delete next[stepId]
      return next
    })
  }, [])

  // Reset form
  const reset = React.useCallback(() => {
    setCurrentStep(0)
    setCompletedSteps(new Set())
    setFormData(initialData)
    setIsDirty(false)
    setIsSubmitting(false)
    setErrors({})

    // Clear persisted draft
    if (config.persistenceKey && typeof window !== "undefined") {
      localStorage.removeItem(config.persistenceKey)
    }
  }, [initialData, config.persistenceKey])

  // Submit form
  const submit = React.useCallback(async () => {
    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      reset()
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, onSubmit, reset])

  // Save draft to localStorage
  const saveDraft = React.useCallback(async () => {
    if (!config.persistenceKey || typeof window === "undefined") return

    const draft = {
      currentStep,
      completedSteps: Array.from(completedSteps),
      formData,
      savedAt: new Date().toISOString(),
    }

    localStorage.setItem(config.persistenceKey, JSON.stringify(draft))
    setIsDirty(false)
  }, [config.persistenceKey, currentStep, completedSteps, formData])

  // Load draft from localStorage
  const loadDraft = React.useCallback(async (): Promise<boolean> => {
    if (!config.persistenceKey || typeof window === "undefined") return false

    const saved = localStorage.getItem(config.persistenceKey)
    if (!saved) return false

    try {
      const draft = JSON.parse(saved) as {
        currentStep: number
        completedSteps: string[]
        formData: Record<string, unknown>
      }

      setCurrentStep(draft.currentStep)
      setCompletedSteps(new Set(draft.completedSteps))
      setFormData(draft.formData)
      setIsDirty(false)

      return true
    } catch {
      return false
    }
  }, [config.persistenceKey])

  const value: MultiStepFormContextValue = {
    config,
    currentStep,
    currentStepConfig,
    totalSteps,
    progress,
    isFirstStep,
    isLastStep,
    completedSteps: Array.from(completedSteps),
    isDirty,
    isSubmitting,
    errors,
    next,
    back,
    goTo,
    canNavigateTo,
    validateCurrentStep,
    isStepValid,
    setStepError,
    clearStepError,
    getStepData,
    setStepData,
    getAllData,
    reset,
    submit,
    saveDraft,
    loadDraft,
  }

  return (
    <MultiStepFormContext.Provider value={value}>
      {children}
    </MultiStepFormContext.Provider>
  )
}

/**
 * Hook to access multi-step form context
 * Throws if used outside provider
 */
export function useMultiStepForm(): MultiStepFormContextValue {
  const context = React.useContext(MultiStepFormContext)

  if (!context) {
    throw new Error(
      "useMultiStepForm must be used within a MultiStepFormProvider"
    )
  }

  return context
}

/**
 * Optional hook that returns null if outside provider
 * Useful for conditional rendering
 */
export function useMultiStepFormOptional(): MultiStepFormContextValue | null {
  return React.useContext(MultiStepFormContext)
}
