"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
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
    if (capacityData?.teachers && capacityData?.sectionsPerGrade) {
      enableNext()
    } else {
      disableNext()
    }
  }, [capacityData, enableNext, disableNext])

  if (loading) {
    return (
      <FormLayout>
        <div className="space-y-3">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
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
        schoolLevel={capacityData?.schoolLevel || "both"}
        dictionary={dictionary}
      />
    </FormLayout>
  )
}
