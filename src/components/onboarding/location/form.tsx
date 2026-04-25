"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import type { Dictionary } from "@/components/internationalization/dictionaries"
import { createI18nHelpers } from "@/components/internationalization/helpers"

import { useHostValidation } from "../host-validation-context"
import { updateSchoolLocation } from "./actions"
import { MapForm } from "./map-form"
import { createLocationSchema, type LocationFormData } from "./validation"

interface LocationFormProps {
  schoolId: string
  initialData?: Partial<LocationFormData>
  onSuccess?: () => void
  dictionary?: Dictionary
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

  const { v, e } = useMemo(() => {
    if (!dictionary?.messages) return { v: undefined, e: undefined }
    const { validation, error } = createI18nHelpers(dictionary.messages)
    return { v: validation, e: error }
  }, [dictionary])

  const schema = useMemo(() => createLocationSchema(v), [v])

  const ERROR_MAP: Record<string, string> = useMemo(
    () => ({
      VALIDATION_ERROR:
        v?.get("invalidSelection") ?? "Please fill in all required fields",
      SCHOOL_NOT_FOUND: e?.tenant.schoolNotFound() ?? "School not found",
    }),
    [v, e]
  )

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
      if (!locationData.address && hasMapbox) {
        setError(v?.get("addressRequired") ?? "Please select a location")
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
          const validatedData = schema.parse(locationData)

          const result = await updateSchoolLocation(schoolId, validatedData)

          if (result.success) {
            onSuccess?.()
            router.push(`/onboarding/${schoolId}/stand-out`)
          } else {
            setError(
              (result.code && ERROR_MAP[result.code]) ??
                e?.server.internalError() ??
                "An error occurred"
            )
          }
        } catch (err) {
          if (
            err &&
            typeof err === "object" &&
            "errors" in (err as Record<string, unknown>)
          ) {
            setError(
              v?.get("invalidSelection") ?? "Please fill in all required fields"
            )
          } else {
            setError(
              e?.server.internalError() ?? "An unexpected error occurred"
            )
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
    hasMapbox,
    schema,
    v,
    e,
    ERROR_MAP,
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
