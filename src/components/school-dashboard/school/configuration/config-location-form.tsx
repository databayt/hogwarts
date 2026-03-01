"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useRef, useState, useTransition } from "react"
import { Check, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { MapForm } from "@/components/onboarding/location/map-form"
import type { LocationFormData } from "@/components/onboarding/location/validation"

import { updateSchoolLocation } from "./actions"

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
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const locationRef = useRef<LocationFormData>(initialData)

  const handleLocationChange = useCallback((data: LocationFormData) => {
    locationRef.current = data
    setSaved(false)
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
        setSaved(true)
      } else {
        setError(result.error || "Failed to update location")
      }
    })
  }

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

      <div className="flex justify-end">
        <Button size="sm" onClick={handleSave} disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="me-1 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <Check className="me-1 h-4 w-4" />
              Saved
            </>
          ) : (
            "Save"
          )}
        </Button>
      </div>
    </div>
  )
}
