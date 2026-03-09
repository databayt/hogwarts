"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { useHostValidation } from "../host-validation-context"
import { updateSchoolLocation } from "./actions"
import { MapForm } from "./map-form"
import { locationSchema, type LocationFormData } from "./validation"

interface LocationFormProps {
  schoolId: string
  initialData?: Partial<LocationFormData>
  onSuccess?: () => void
  dictionary?: any
}

export function LocationForm({
  schoolId,
  initialData,
  onSuccess,
  dictionary,
}: LocationFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string>("")
  const [locationData, setLocationData] = useState<LocationFormData>({
    address: initialData?.address || "",
    city: initialData?.city || "",
    state: initialData?.state || "",
    country: initialData?.country || "",
    postalCode: initialData?.postalCode || "",
    latitude: initialData?.latitude || 0,
    longitude: initialData?.longitude || 0,
  })

  const { setCustomNavigation, enableNext, disableNext } = useHostValidation()
  const hasMapbox = !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  // Enable/disable next button based on location selection
  // If Mapbox token is not configured, allow skipping
  useEffect(() => {
    if (!hasMapbox || locationData.address) {
      enableNext()
    } else {
      disableNext()
    }
  }, [locationData, enableNext, disableNext, hasMapbox])

  // Set up custom navigation to save on next
  useEffect(() => {
    const handleNext = () => {
      // Skip validation if no Mapbox token or no address entered
      if (!locationData.address && hasMapbox) {
        setError("Please select a location")
        return
      }

      // If no address entered (Mapbox unavailable), just skip to next step
      if (!locationData.address) {
        router.push(`/onboarding/${schoolId}/stand-out`)
        return
      }

      startTransition(async () => {
        try {
          setError("")

          // Validate the data
          const validatedData = locationSchema.parse(locationData)

          const result = await updateSchoolLocation(schoolId, validatedData)

          if (result.success) {
            onSuccess?.()
            // Navigate to next step
            router.push(`/onboarding/${schoolId}/stand-out`)
          } else {
            setError(result.error || "Failed to update location")
          }
        } catch (err: any) {
          if (err.errors) {
            setError("Please fill in all required fields")
          } else {
            setError("An unexpected error occurred")
          }
        }
      })
    }

    setCustomNavigation({
      onNext: handleNext,
      nextDisabled: isPending || (hasMapbox && !locationData.address),
    })

    return () => {
      setCustomNavigation(undefined)
    }
  }, [
    locationData,
    schoolId,
    router,
    onSuccess,
    setCustomNavigation,
    isPending,
  ])

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-destructive bg-destructive/10 rounded-md p-3 text-sm">
          {error}
        </div>
      )}

      <MapForm
        initialData={initialData}
        onLocationChange={setLocationData}
        dictionary={dictionary}
      />
    </div>
  )
}
