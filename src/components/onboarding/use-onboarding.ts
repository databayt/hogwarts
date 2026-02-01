"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

import {
  getListing,
  getSchoolSetupStatus,
  getUserSchools,
  proceedToTitle,
  updateListing,
} from "./actions"
import { ONBOARDING_STEPS, STEP_ORDER } from "./config"
import type {
  OnboardingFormState,
  OnboardingProgress,
  OnboardingSchoolData,
  OnboardingStep,
  SchoolWithStatus,
} from "./types"
import { validateStep } from "./validation"

/**
 * useOnboarding Hook - School Setup Progress Tracking
 *
 * Manages onboarding flow with:
 * - School data loading (name, address, etc.)
 * - Progress tracking (completed steps %, nextStep)
 * - Step validation (must complete required fields before proceeding)
 * - Step accessibility (some steps require dependencies)
 * - Navigation between steps
 *
 * KEY PATTERNS:
 * - PARALLEL LOADING: Fetches school data + status simultaneously
 * - PROGRESS GATES: Can't proceed until 80% complete
 * - STEP DEPENDENCIES: Some steps locked until others are complete
 * - VALIDATION BEFORE SAVE: Validates step data before updateSchool
 * - AUTO-REFRESH: loadSchoolData() called after each update
 */

// Main onboarding hook
export function useOnboarding(schoolId?: string) {
  const router = useRouter()
  const params = useParams()

  const [school, setSchool] = useState<OnboardingSchoolData | null>(null)
  const [progress, setProgress] = useState<OnboardingProgress | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentSchoolId = schoolId || (params?.id as string)
  const currentStep = (params?.step as OnboardingStep) || "about-school"

  // Load school data and progress
  const loadSchoolData = useCallback(async () => {
    if (!currentSchoolId) return

    try {
      setIsLoading(true)
      setError(null)

      const [schoolResponse, statusResponse] = await Promise.all([
        getListing(currentSchoolId),
        getSchoolSetupStatus(currentSchoolId),
      ])

      if (schoolResponse.success && schoolResponse.data) {
        setSchool(schoolResponse.data)
      } else {
        setError(
          typeof schoolResponse.error === "string"
            ? schoolResponse.error
            : "Failed to load school"
        )
      }

      if (statusResponse.success && statusResponse.data) {
        const statusData = statusResponse.data as SchoolWithStatus
        setProgress({
          schoolId: currentSchoolId,
          currentStep,
          completedSteps: getCompletedSteps(statusData),
          completionPercentage: statusData.completionPercentage,
          nextStep: statusData.nextStep,
          canProceed: statusData.completionPercentage >= 80, // Can proceed if 80% complete
        })
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred"
      setError(errorMessage)
      console.error("Error loading school data:", errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [currentSchoolId, currentStep])

  // Update school data
  const updateSchoolData = useCallback(
    async (data: Partial<OnboardingSchoolData>) => {
      if (!currentSchoolId) return

      try {
        setIsSaving(true)
        const response = await updateListing(currentSchoolId, data)

        if (response.success && response.data) {
          setSchool((prev) => ({ ...prev, ...response.data }))
          console.log("Changes saved successfully")

          // Refresh progress after update
          await loadSchoolData()
        } else {
          throw new Error(
            typeof response.error === "string"
              ? response.error
              : "Failed to update school"
          )
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to save changes"
        console.error("Error updating school:", errorMessage)
        throw err
      } finally {
        setIsSaving(false)
      }
    },
    [currentSchoolId, loadSchoolData]
  )

  // Navigate to next step
  const goToNextStep = useCallback(async () => {
    if (!currentSchoolId || !progress?.nextStep) return

    try {
      await proceedToTitle(currentSchoolId)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to proceed to next step"
      console.error("Error proceeding to next step:", errorMessage)
    }
  }, [currentSchoolId, progress?.nextStep])

  // Navigate to specific step
  const goToStep = useCallback(
    (step: OnboardingStep) => {
      if (!currentSchoolId) return
      router.push(`/onboarding/${currentSchoolId}/${step}`)
    },
    [currentSchoolId, router]
  )

  // Validate current step
  const validateCurrentStep = useCallback(() => {
    if (!school) return { isValid: false, errors: {} }
    return validateStep(currentStep, school)
  }, [school, currentStep])

  // Check if step is accessible
  const isStepAccessible = useCallback(
    (step: OnboardingStep) => {
      const stepConfig = ONBOARDING_STEPS[step]
      if (!stepConfig.dependencies || stepConfig.dependencies.length === 0) {
        return true
      }

      return stepConfig.dependencies.every((dep) =>
        progress?.completedSteps.includes(dep)
      )
    },
    [progress?.completedSteps]
  )

  // Load data on mount or when schoolId changes
  useEffect(() => {
    loadSchoolData()
  }, [loadSchoolData])

  return {
    // Data
    school,
    progress,
    currentStep,

    // State
    isLoading,
    isSaving,
    error,

    // Actions
    updateSchool: updateSchoolData,
    goToNextStep,
    goToStep,
    refreshData: loadSchoolData,

    // Validation
    validateCurrentStep,
    isStepAccessible,
  }
}

// Hook for managing form state
export function useOnboardingForm(initialData?: Partial<OnboardingSchoolData>) {
  const [formState, setFormState] = useState<OnboardingFormState>({
    isLoading: false,
    isSubmitting: false,
    errors: {},
    touched: {},
    isDirty: false,
  })

  const [data, setData] = useState<Partial<OnboardingSchoolData>>(
    initialData || {}
  )

  const updateField = useCallback(
    (field: keyof OnboardingSchoolData, value: any) => {
      setData((prev) => ({ ...prev, [field]: value }))
      setFormState((prev) => {
        const newErrors = { ...prev.errors }
        delete newErrors[field] // Clear field error on change
        return {
          ...prev,
          touched: { ...prev.touched, [field]: true },
          isDirty: true,
          errors: newErrors,
        }
      })
    },
    []
  )

  const updateFields = useCallback((fields: Partial<OnboardingSchoolData>) => {
    setData((prev) => ({ ...prev, ...fields }))
    setFormState((prev) => ({
      ...prev,
      isDirty: true,
      touched: Object.keys(fields).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        prev.touched
      ),
    }))
  }, [])

  const setFieldError = useCallback((field: string, error: string) => {
    setFormState((prev) => ({
      ...prev,
      errors: { ...prev.errors, [field]: error },
    }))
  }, [])

  const clearFieldError = useCallback((field: string) => {
    setFormState((prev) => {
      const newErrors = { ...prev.errors }
      delete newErrors[field]
      return {
        ...prev,
        errors: newErrors,
      }
    })
  }, [])

  const setLoading = useCallback((isLoading: boolean) => {
    setFormState((prev) => ({ ...prev, isLoading }))
  }, [])

  const setSubmitting = useCallback((isSubmitting: boolean) => {
    setFormState((prev) => ({ ...prev, isSubmitting }))
  }, [])

  const resetForm = useCallback((newData?: Partial<OnboardingSchoolData>) => {
    setData(newData || {})
    setFormState({
      isLoading: false,
      isSubmitting: false,
      errors: {},
      touched: {},
      isDirty: false,
    })
  }, [])

  return {
    data,
    formState,
    updateField,
    updateFields,
    setFieldError,
    clearFieldError,
    setLoading,
    setSubmitting,
    resetForm,
  }
}

// Hook for managing multiple schools
export function useUserSchools() {
  const [schools, setSchools] = useState<OnboardingSchoolData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSchools = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await getUserSchools()

      if (response.success && response.data) {
        setSchools(response.data)
      } else {
        setError(
          typeof response.error === "string"
            ? response.error
            : "Failed to load schools"
        )
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load schools"
      setError(errorMessage)
      console.error("Error loading schools:", errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSchools()
  }, [loadSchools])

  return {
    schools,
    isLoading,
    error,
    refreshSchools: loadSchools,
  }
}

// Helper function to determine completed steps
// Checks all 15 onboarding steps for completion status
function getCompletedSteps(statusData: SchoolWithStatus): OnboardingStep[] {
  const completedSteps: OnboardingStep[] = []

  // Phase 1: Basic Information (5 steps)
  // =====================================

  // about-school: Always considered "visited" if we have any school data
  // This is an intro step, so if user has proceeded past it, it's complete
  if (statusData.id) {
    completedSteps.push("about-school")
  }

  // title: School has a real name (not the default)
  if (statusData.name && statusData.name !== "New School") {
    completedSteps.push("title")
  }

  // description: School has a description
  if (statusData.description && statusData.description.length > 0) {
    completedSteps.push("description")
  }

  // location: School has an address set
  if (statusData.address) {
    completedSteps.push("location")
  }

  // stand-out: Optional step - check if any unique features are set
  // This could be extended to check specific fields like highlights, features, etc.
  // For now, consider it complete if description is substantial (> 100 chars)
  if (statusData.description && statusData.description.length > 100) {
    completedSteps.push("stand-out")
  }

  // Phase 2: Setup (4 steps)
  // ========================

  // capacity: Both students and teachers capacity are set
  if (statusData.maxStudents && statusData.maxTeachers) {
    completedSteps.push("capacity")
  }

  // branding: Logo or primary color has been customized
  if (statusData.logo || statusData.primaryColor) {
    completedSteps.push("branding")
  }

  // import: Optional - considered complete if any teachers/students exist
  // This would require additional data, so mark as optional/skippable
  // For simplicity, mark complete if capacity step is done (implies ready for import)
  if (statusData.maxStudents && statusData.maxTeachers) {
    completedSteps.push("import")
  }

  // finish-setup: Complete when all setup phase steps are done
  const setupStepsComplete =
    completedSteps.includes("capacity") && completedSteps.includes("branding")
  if (setupStepsComplete) {
    completedSteps.push("finish-setup")
  }

  // Phase 3: Business & Legal (5 steps)
  // ===================================

  // join: Considered complete if user is authenticated and linked to school
  // Since this is in context of a school, if we have data, user has "joined"
  if (statusData.id) {
    completedSteps.push("join")
  }

  // visibility: Optional - check if visibility settings exist
  // Default to complete since visibility has defaults
  if (statusData.isPublished !== undefined) {
    completedSteps.push("visibility")
  }

  // price: Tuition fee and currency are set
  if (statusData.tuitionFee && statusData.currency) {
    completedSteps.push("price")
  }

  // discount: Optional - could check for discount codes
  // For now, mark complete if pricing is set (discounts are optional)
  if (statusData.tuitionFee && statusData.currency) {
    completedSteps.push("discount")
  }

  // legal: Check if legal consent was given (requires isComplete or similar flag)
  // If school is published or marked complete, legal must have been accepted
  if (statusData.isComplete || statusData.isPublished) {
    completedSteps.push("legal")
  }

  // Bonus: subdomain
  // subdomain: Check if custom domain is set
  if (statusData.domain && statusData.domain !== statusData.id) {
    completedSteps.push("subdomain")
  }

  return completedSteps
}
