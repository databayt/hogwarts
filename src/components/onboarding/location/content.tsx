"use client"

import React, { useEffect } from "react"
import { useParams } from "next/navigation"
import { AlertCircle } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { FormHeading, FormLayout } from "@/components/form"
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
      <FormLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full" />
        </div>
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </FormLayout>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <FormLayout>
      <FormHeading
        title={dict.whereIsYourSchool || "Where's your school located?"}
        description={
          dict.schoolLocationDescription ||
          "Your school's address will be visible to parents and staff members."
        }
      />
      <LocationForm
        schoolId={schoolId}
        initialData={locationData || undefined}
        dictionary={dictionary}
      />
    </FormLayout>
  )
}
