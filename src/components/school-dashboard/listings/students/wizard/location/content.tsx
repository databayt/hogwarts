"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useCallback, useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import { useWizardValidation } from "@/components/form/template/wizard-validation-context"
import type { WizardFormRef } from "@/components/form/wizard"
import { useWizardRuntime } from "@/components/form/wizard"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { useLocale } from "@/components/internationalization/use-locale"

import { useStudentWizard } from "../use-student-wizard"
import { LocationForm } from "./form"

export default function LocationContent() {
  const params = useParams()
  const router = useRouter()
  const { locale } = useLocale()
  const studentId = params.id as string

  const { data, isLoading } = useStudentWizard()
  const { dictionary } = useDictionary()
  const students = (dictionary?.school as Record<string, unknown>)?.students as
    | Record<string, unknown>
    | undefined
  const t = students?.location as Record<string, string> | undefined

  const { enableNext, disableNext, setCustomNavigation, setOnSave } =
    useWizardValidation()
  const formRef = useRef<WizardFormRef>(null)
  const [isValid, setIsValid] = useState(true)
  const runtime = useWizardRuntime()

  // Optimistic: academic paints now, this save finishes behind it (the form
  // handle is taken at click time — a hidden step's ref detaches).
  const onNext = useCallback(async () => {
    const form = formRef.current
    const next = `/${locale}/students/add/${studentId}/academic`
    try {
      if (runtime) {
        await runtime.advance(next, () => form?.saveAndNext())
      } else {
        await form?.saveAndNext()
        router.push(next)
      }
    } catch (error) {
      console.error("Error saving location step:", error)
    }
  }, [locale, studentId, router, runtime])

  // Save without advancing — used by the footer's save-and-skip Bookmark icon.
  // Re-throws so the footer aborts the redirect on failure.
  const onSaveStep = useCallback(async () => {
    const form = formRef.current
    if (!runtime) return form?.saveAndNext()
    const saved = await runtime.enqueue(
      () => form?.saveAndNext(),
      window.location.pathname
    )
    if (!saved) throw new Error("SAVE_FAILED")
  }, [runtime])

  useEffect(() => {
    if (isValid) {
      enableNext()
      setCustomNavigation({ onNext })
      setOnSave(onSaveStep)
    } else {
      disableNext()
      setCustomNavigation(undefined)
      setOnSave(undefined)
    }
    return () => {
      setCustomNavigation(undefined)
      setOnSave(undefined)
    }
  }, [
    isValid,
    enableNext,
    disableNext,
    setCustomNavigation,
    setOnSave,
    onNext,
    onSaveStep,
  ])

  if (isLoading) {
    return null
  }

  return (
    <FormLayout>
      <FormHeading
        title={t?.title || "Location"}
        description={t?.description || "Add the student's home address."}
      />
      <LocationForm
        ref={formRef}
        studentId={studentId}
        initialData={
          data
            ? {
                currentAddress: data.currentAddress ?? undefined,
                city: data.city ?? undefined,
                state: data.state ?? undefined,
                postalCode: data.postalCode ?? undefined,
                country: data.country ?? undefined,
              }
            : undefined
        }
        onValidChange={setIsValid}
      />
    </FormLayout>
  )
}
