"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { ReactNode, RefObject, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

import { Skeleton } from "@/components/ui/skeleton"
import { FormLayout } from "@/components/form/template/layout"
import { useWizardValidation } from "@/components/form/template/wizard-validation-context"
import { useLocale } from "@/components/internationalization/use-locale"

import type { WizardFormRef } from "./config"
import { useWizardRuntime, withLocale } from "./wizard-runtime"

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
  /**
   * Where to go once the final step saves, e.g. "/announcements".
   *
   * Without this a last step is a dead end: `setCustomNavigation` takes
   * precedence over FormFooter's own `finalDestination` handling, so the save
   * succeeds and the user is simply left sitting on the completed form.
   * Locale prefix is added here — pass the unprefixed path.
   */
  finalDestination?: string
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
  finalDestination,
  isValid,
  formRef,
  isLoading = false,
  isReviewStep = false,
  children,
}: WizardStepProps) {
  const router = useRouter()
  const { locale } = useLocale()
  const { enableNext, disableNext, setCustomNavigation, setOnSave } =
    useWizardValidation()
  const runtime = useWizardRuntime()
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

    // Hrefs are passed unprefixed ("/teachers/add/…"); pushing them as-is
    // sent every Next through the proxy's locale redirect.
    const nextHref = nextStep ? withLocale(nextStep, locale) : null
    const finalHref = finalDestination
      ? withLocale(finalDestination, locale)
      : null

    const handleNext = async () => {
      if (isSavingRef.current) return
      // Take the form's handle now — a step that is hidden later detaches
      // its ref, but the handle keeps working.
      const form = formRef.current
      isSavingRef.current = true
      try {
        if (runtime?.clientSteps && nextHref) {
          // Optimistic: the next step paints now, this save finishes behind it.
          await runtime.advance(nextHref, () => form?.saveAndNext())
          return
        }
        if (runtime && !(await runtime.drain())) return
        await form?.saveAndNext()
        if (nextHref) {
          router.push(nextHref)
        } else if (finalHref) {
          router.push(finalHref)
        }
      } catch {
        // Error handled in form
      } finally {
        isSavingRef.current = false
      }
    }

    setCustomNavigation({ onNext: handleNext })

    // Register save-only handler (saves without navigating)
    const handleSave = async () => {
      if (isSavingRef.current) return
      const form = formRef.current
      isSavingRef.current = true
      try {
        if (runtime) {
          const saved = await runtime.enqueue(
            () => form?.saveAndNext(),
            window.location.pathname
          )
          if (!saved) throw new Error("SAVE_FAILED")
        } else {
          await form?.saveAndNext()
        }
      } catch {
        // Error handled in form
      } finally {
        isSavingRef.current = false
      }
    }
    setOnSave(handleSave)

    return () => {
      setCustomNavigation(undefined)
      setOnSave(undefined)
    }
  }, [
    entityId,
    nextStep,
    finalDestination,
    locale,
    router,
    setCustomNavigation,
    setOnSave,
    formRef,
    isReviewStep,
    runtime,
  ])

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
