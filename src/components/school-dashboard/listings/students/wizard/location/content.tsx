"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useCallback, useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import { useWizardValidation } from "@/components/form/template/wizard-validation-context"
import type { WizardFormRef } from "@/components/form/wizard"
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

  const { enableNext, disableNext, setCustomNavigation } = useWizardValidation()
  const formRef = useRef<WizardFormRef>(null)
  const [isValid, setIsValid] = useState(true)

  const onNext = useCallback(async () => {
    try {
      if (formRef.current) {
        await formRef.current.saveAndNext()
      }
      router.push(`/${locale}/students/add/${studentId}/academic`)
    } catch (error) {
      console.error("Error saving location step:", error)
    }
  }, [locale, studentId, router])

  useEffect(() => {
    if (isValid) {
      enableNext()
      setCustomNavigation({ onNext })
    } else {
      disableNext()
      setCustomNavigation(undefined)
    }
  }, [isValid, enableNext, disableNext, setCustomNavigation, onNext])

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
