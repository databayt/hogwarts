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
        <div className="space-y-3 sm:space-y-4">
          <Skeleton className="h-8 w-52 sm:h-9" />
          <Skeleton className="h-8 w-28 sm:h-9" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-full sm:h-5" />
            <Skeleton className="h-4 w-3/4 sm:h-5" />
          </div>
        </div>
        <div className="space-y-6">
          <div>
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="border-border flex items-center justify-between border-b py-4 last:border-b-0 sm:py-6"
              >
                <Skeleton className="h-5 w-28 sm:w-36" />
                <div className="flex items-center gap-2 sm:gap-3">
                  <Skeleton className="h-10 w-10 rounded-full sm:h-7 sm:w-7" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-10 w-10 rounded-full sm:h-7 sm:w-7" />
                </div>
              </div>
            ))}
          </div>
          <Skeleton className="h-24 w-full rounded-lg" />
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
