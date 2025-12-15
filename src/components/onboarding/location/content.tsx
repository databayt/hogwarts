"use client"

import React, { useEffect } from "react"
import { useParams } from "next/navigation"
import { AlertCircle } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { useHostValidation } from "@/components/onboarding/host-validation-context"

import { LocationForm } from "./form"
import { useLocation } from "./use-location"

interface Props {
  dictionary?: any
}

export default function LocationContent({ dictionary }: Props) {
  const dict = dictionary?.onboarding || {}
  const params = useParams()
  const schoolId = params.id as string
  const { enableNext, disableNext } = useHostValidation()
  const { data: locationData, loading, error } = useLocation(schoolId)

  // Enable/disable next button based on form completion
  useEffect(() => {
    if (locationData?.address?.trim()) {
      enableNext()
    } else {
      disableNext()
    }
  }, [locationData, enableNext, disableNext])

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
          </div>

          {/* Right side - Form skeleton */}
          <div className="space-y-6">
            <Skeleton className="h-[300px] w-full rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2 lg:gap-20">
          {/* Left side - Text content */}
          <div className="space-y-3 sm:space-y-4">
            <h1 className="text-3xl font-bold">
              {dict.whereIsYourSchool || "Where's your school located?"}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              {dict.schoolLocationDescription ||
                "Your school's address will be visible to parents and staff members."}
            </p>
          </div>

          {/* Right side - Form */}
          <div>
            <LocationForm
              schoolId={schoolId}
              initialData={locationData || undefined}
              dictionary={dictionary}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
