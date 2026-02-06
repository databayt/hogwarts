"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"

import { type LocationResult } from "@/lib/mapbox"

import { type LocationFormData } from "./validation"

// Dynamic import with SSR disabled (mapbox-gl requires browser APIs)
const MapboxLocationPicker = dynamic(
  () =>
    import("@/components/atom/mapbox-location-picker").then(
      (mod) => mod.MapboxLocationPicker
    ),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-3">
        <div className="bg-muted/50 h-10 w-full animate-pulse rounded-md" />
        <div className="bg-muted/50 h-[320px] w-full animate-pulse rounded-xl" />
      </div>
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

  const handleLocationChange = (result: LocationResult) => {
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

  // Build value from current location data (pass to picker for map + address preview)
  const pickerValue = locationData.address
    ? {
        address: locationData.address,
        city: locationData.city,
        state: locationData.state,
        country: locationData.country,
        postalCode: locationData.postalCode,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
      }
    : null

  return (
    <MapboxLocationPicker
      value={pickerValue}
      onChange={handleLocationChange}
      placeholder={
        dictionary?.onboarding?.searchAddress || "Search for an address..."
      }
    />
  )
}
