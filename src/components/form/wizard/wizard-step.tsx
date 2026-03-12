"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { ReactNode, RefObject, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

import { Skeleton } from "@/components/ui/skeleton"
import { FormLayout } from "@/components/form/template/layout"
import { useWizardValidation } from "@/components/form/template/wizard-validation-context"

import type { WizardFormRef } from "./config"

/**
 * Generic Wizard Step Wrapper
 *
 * Extracts the boilerplate that every wizard step content.tsx repeats:
 * - enableNext/disableNext based on isValid
 * - setCustomNavigation with save-before-navigate
 * - Loading skeleton
 *
 * @example
 * ```tsx
 * export default function InformationContent({ dictionary }) {
 *   const params = useParams()
 *   const teacherId = params.id as string
 *   const formRef = useRef<WizardFormRef>(null)
 *   const { data, loading } = useTeacherInformation(teacherId)
 *   const [isValid, setIsValid] = useState(false)
 *
 *   return (
 *     <WizardStep
 *       entityId={teacherId}
 *       nextStep={`/teachers/add/${teacherId}/contact`}
 *       isValid={isValid}
 *       formRef={formRef}
 *       isLoading={loading}
 *     >
 *       <FormHeading title="Basic Information" />
 *       <InformationForm ref={formRef} onValidChange={setIsValid} />
 *     </WizardStep>
 *   )
 * }
 * ```
 */

interface WizardStepProps {
  /** Entity ID (used for URL construction) */
  entityId: string
  /** Full URL path for the next step (e.g., "/teachers/add/{id}/contact") */
  nextStep?: string
  /** Whether the current step's form is valid (controls enableNext/disableNext) */
  isValid: boolean
  /** Ref to the form component (must expose saveAndNext) */
  formRef: RefObject<WizardFormRef | null>
  /** Whether step data is still loading */
  isLoading?: boolean
  /** Whether this is a review/read-only step (no save needed before navigate) */
  isReviewStep?: boolean
  children: ReactNode
}

export function WizardStep({
  entityId,
  nextStep,
  isValid,
  formRef,
  isLoading = false,
  isReviewStep = false,
  children,
}: WizardStepProps) {
  const router = useRouter()
  const { enableNext, disableNext, setCustomNavigation } = useWizardValidation()
  const isSavingRef = useRef(false)

  // Control next button state based on form validity
  useEffect(() => {
    if (isValid) {
      enableNext()
    } else {
      disableNext()
    }
  }, [isValid, enableNext, disableNext])

  // Set up custom navigation: save form data before navigating to next step
  useEffect(() => {
    if (isReviewStep) {
      // Review steps don't need save-before-navigate
      return
    }

    const handleNext = async () => {
      if (isSavingRef.current) return
      isSavingRef.current = true
      try {
        await formRef.current?.saveAndNext()
        if (nextStep) {
          router.push(nextStep)
        }
      } catch {
        // Error handled in form
      } finally {
        isSavingRef.current = false
      }
    }

    setCustomNavigation({ onNext: handleNext })
    return () => setCustomNavigation(undefined)
  }, [entityId, nextStep, router, setCustomNavigation, formRef, isReviewStep])

  if (isLoading) {
    return (
      <FormLayout>
        <div className="space-y-3">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full rounded-md" />
          <Skeleton className="h-12 w-full rounded-md" />
        </div>
      </FormLayout>
    )
  }

  return <>{children}</>
}
