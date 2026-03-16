"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useRef, useState, useTransition } from "react"

import { MapForm } from "@/components/onboarding/location/map-form"
import type { LocationFormData } from "@/components/onboarding/location/validation"

import { updateSchoolLocation } from "./actions"
import { useAutoSave } from "./use-auto-save"

interface Props {
  schoolId: string
  initialData: LocationFormData
  dictionary?: any
}

export function ConfigLocationForm({
  schoolId,
  initialData,
  dictionary,
}: Props) {
  const [, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [isDirty, setIsDirty] = useState(false)
  const locationRef = useRef<LocationFormData>(initialData)

  const handleLocationChange = useCallback((data: LocationFormData) => {
    locationRef.current = data
    setIsDirty(true)
  }, [])

  const handleSave = () => {
    const data = locationRef.current
    startTransition(async () => {
      setError("")
      const result = await updateSchoolLocation(schoolId, {
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        latitude: data.latitude,
        longitude: data.longitude,
      })
      if (result.success) {
        setIsDirty(false)
      } else {
        setError(result.error || "Failed to update location")
      }
    })
  }

  useAutoSave(handleSave, isDirty)

  return (
    <div className="space-y-4">
      <MapForm
        initialData={initialData}
        onLocationChange={handleLocationChange}
        dictionary={dictionary}
      />

      {error && (
        <div className="text-destructive bg-destructive/10 rounded-md p-3 text-sm">
          {error}
        </div>
      )}
    </div>
  )
}
