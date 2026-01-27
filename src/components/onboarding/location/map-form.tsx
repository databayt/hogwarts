"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"

import { Card } from "@/components/ui/card"
import { type LocationResult } from "@/components/atom/mapbox-autocomplete"
import { Icons } from "@/components/icons"

import { type LocationFormData } from "./validation"

// Dynamic import with SSR disabled to avoid Node.js dependencies in Turbopack
const MapboxAutocomplete = dynamic(
  () =>
    import("@/components/atom/mapbox-autocomplete").then(
      (mod) => mod.MapboxAutocomplete
    ),
  {
    ssr: false,
    loading: () => (
      <div className="bg-muted/50 h-10 w-full animate-pulse rounded-md" />
    ),
  }
)

interface MapFormProps {
  initialData?: Partial<LocationFormData>
  onLocationChange: (data: LocationFormData) => void
  dictionary?: any
}

export function MapForm({
  initialData,
  onLocationChange,
  dictionary,
}: MapFormProps) {
  const [locationData, setLocationData] = useState<LocationFormData>({
    address: initialData?.address || "",
    city: initialData?.city || "",
    state: initialData?.state || "",
    country: initialData?.country || "",
    postalCode: initialData?.postalCode || "",
    latitude: initialData?.latitude || 0,
    longitude: initialData?.longitude || 0,
  })

  // Update parent component when location data changes
  useEffect(() => {
    onLocationChange(locationData)
  }, [locationData, onLocationChange])

  const handleLocationSelect = (result: LocationResult) => {
    setLocationData({
      address: result.address,
      city: result.city,
      state: result.state,
      country: result.country,
      postalCode: result.postalCode,
      latitude: result.latitude,
      longitude: result.longitude,
    })
  }

  return (
    <Card className="border-0 bg-transparent p-0 shadow-none">
      <div className="grid gap-4">
        {/* Mapbox Autocomplete Search */}
        <div className="relative">
          <MapboxAutocomplete
            value={locationData.address}
            onSelect={handleLocationSelect}
            placeholder={
              dictionary?.onboarding?.searchAddress ||
              "Search for an address..."
            }
          />
        </div>

        {/* Show selected location details (read-only) */}
        {locationData.address && (
          <div className="bg-muted/50 space-y-3 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Icons.mapPin className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium">{locationData.address}</p>
                {(locationData.city ||
                  locationData.state ||
                  locationData.country) && (
                  <p className="text-muted-foreground text-xs">
                    {[
                      locationData.city,
                      locationData.state,
                      locationData.country,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
                {locationData.latitude !== 0 &&
                  locationData.longitude !== 0 && (
                    <p className="text-muted-foreground text-xs">
                      {locationData.latitude.toFixed(6)},{" "}
                      {locationData.longitude.toFixed(6)}
                    </p>
                  )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
