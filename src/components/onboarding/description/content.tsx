"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

import { Skeleton } from "@/components/ui/skeleton"
import { FormHeading, FormLayout } from "@/components/form"
import { useHostValidation } from "@/components/onboarding/host-validation-context"

import { DescriptionForm } from "./form"
import { useDescription } from "./use-description"

interface Props {
  dictionary?: any
}

export default function DescriptionContent({ dictionary }: Props) {
  const params = useParams()
  const router = useRouter()
  const schoolId = params.id as string
  const { enableNext, setCustomNavigation } = useHostValidation()
  const { data: descriptionData, loading } = useDescription(schoolId)
  const [step, setStep] = useState<"type" | "level">("type")
  const dict = dictionary?.onboarding || {}

  // Set initial step from loaded data
  useEffect(() => {
    if (
      descriptionData?.schoolType &&
      descriptionData?.schoolLevel &&
      descriptionData.schoolType !== "technical"
    ) {
      setStep("level")
    }
  }, [descriptionData?.schoolType, descriptionData?.schoolLevel])

  // Enable next button
  useEffect(() => {
    enableNext()
  }, [enableNext])

  // Set up custom navigation to handle the Next button
  useEffect(() => {
    const handleNext = () => {
      router.push(`/onboarding/${schoolId}/location`)
    }

    setCustomNavigation({
      onNext: handleNext,
    })

    return () => {
      setCustomNavigation(undefined)
    }
  }, [schoolId, router, setCustomNavigation])

  if (loading) {
    return (
      <FormLayout>
        <div className="space-y-3">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      </FormLayout>
    )
  }

  return (
    <FormLayout>
      <FormHeading
        title={
          step === "type"
            ? (dict.describeEducationModel || "Describe your school's") +
              "\n" +
              (dict.educationModel || "education model")
            : dict.selectGradeLevels || "Select your grade levels"
        }
        description={
          step === "type"
            ? dict.selectSchoolTypeDescription ||
              "Select the type that best describes your school's educational approach and governance structure."
            : dict.selectGradeLevelsDescription ||
              "Choose the academic levels your school serves."
        }
      />
      <DescriptionForm
        schoolId={schoolId}
        initialData={descriptionData || undefined}
        onStepChange={setStep}
        dictionary={dictionary}
      />
    </FormLayout>
  )
}
