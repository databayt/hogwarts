"use client"

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
  const { enableNext, disableNext, setCustomNavigation } = useHostValidation()
  const { data: descriptionData, loading, refresh } = useDescription(schoolId)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const dict = dictionary?.onboarding || {}

  // Enable/disable next button based on school type selection
  useEffect(() => {
    // Default to 'private' if no data exists
    const currentType = selectedType || descriptionData?.schoolType || "private"
    console.log("🟢 Enabling Next button - School type:", currentType)
    enableNext()

    // Set selectedType to 'private' if no data exists
    if (!selectedType && !descriptionData?.schoolType) {
      setSelectedType("private")
    }
  }, [selectedType, descriptionData?.schoolType, enableNext, disableNext])

  // Set up custom navigation to handle the Next button
  useEffect(() => {
    const handleNext = () => {
      console.log("🔵 Description handleNext called - navigating to location")
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
      <div className="mx-auto max-w-6xl">
        <FormLayout>
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-full max-w-sm" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </FormLayout>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="mx-auto max-w-6xl">
        <FormLayout>
          <FormHeading
            title={
              (dict.describeEducationModel || "Describe your school's") +
              "\n" +
              (dict.educationModel || "education model")
            }
            description={
              dict.selectSchoolTypeDescription ||
              "Select the type that best describes your school's educational approach and governance structure."
            }
          />
          <DescriptionForm
            schoolId={schoolId}
            initialData={descriptionData || undefined}
            onTypeSelect={setSelectedType}
            dictionary={dictionary}
          />
        </FormLayout>
      </div>
    </div>
  )
}
