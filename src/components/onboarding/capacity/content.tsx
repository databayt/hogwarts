"use client"

import React, { useEffect } from "react"
import { useParams } from "next/navigation"

import { Skeleton } from "@/components/ui/skeleton"
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
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2 lg:gap-20">
          {/* Left side - Text content skeleton */}
          <div className="space-y-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>

            {/* Preview card skeleton */}
            <div className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <div className="space-y-4 rounded-lg border p-4">
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Form skeleton */}
          <div className="space-y-6">
            <Skeleton className="h-8 w-48" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="w-full">
        <div className="grid grid-cols-1 items-start gap-20 lg:grid-cols-2">
          {/* Left side - Text content and preview */}
          <div className="space-y-3 sm:space-y-4">
            <h1 className="text-3xl font-bold">
              {dict.howManyStudents || "Share some basics about"}
              <br />
              {dict.aboutYourSchool || "your school"}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              {dict.capacityDescription ||
                "Tell us about your school's capacity and facilities. These numbers will help us configure your system properly."}
            </p>
          </div>

          {/* Right side - Form */}
          <div className="lg:justify-self-end">
            <CapacityForm
              schoolId={schoolId}
              initialData={capacityData || undefined}
              dictionary={dictionary}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
