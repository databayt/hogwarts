"use client"

import React, { useEffect } from "react"
import { useParams } from "next/navigation"

import { Skeleton } from "@/components/ui/skeleton"
import { FormHeading, FormLayout } from "@/components/form"
import { useHostValidation } from "@/components/onboarding/host-validation-context"

import { CapacityForm } from "./form"
import { useCapacity } from "./use-capacity"

interface Props {
  dictionary?: any
}

export default function CapacityContent({ dictionary }: Props) {
  const dict = dictionary?.onboarding || {}
  const params = useParams()
  const schoolId = params.id as string
  const { enableNext, disableNext } = useHostValidation()
  const { data: capacityData, loading } = useCapacity(schoolId)

  // Enable/disable next button based on form completion
  useEffect(() => {
    if (capacityData?.studentCount && capacityData?.teachers) {
      enableNext()
    } else {
      disableNext()
    }
  }, [capacityData, enableNext, disableNext])

  if (loading) {
    return (
      <FormLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </FormLayout>
    )
  }

  return (
    <FormLayout>
      <FormHeading
        title={
          (dict.howManyStudents || "Share some basics about") +
          "\n" +
          (dict.aboutYourSchool || "your school")
        }
        description={
          dict.capacityDescription ||
          "Tell us about your school's capacity and facilities. These numbers will help us configure your system properly."
        }
      />
      <CapacityForm
        schoolId={schoolId}
        initialData={capacityData || undefined}
        dictionary={dictionary}
      />
    </FormLayout>
  )
}
