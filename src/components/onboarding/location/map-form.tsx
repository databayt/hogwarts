"use client"

import { useEffect, useState } from "react"
import { MapPin } from "lucide-react"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

import { type LocationFormData } from "./validation"

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
    postalCode: "", // Always empty for database compatibility
    latitude: 0, // Always 0 for database compatibility
    longitude: 0, // Always 0 for database compatibility
  })

  // Update parent component when location data changes
  useEffect(() => {
    onLocationChange(locationData)
  }, [locationData, onLocationChange])

  const handleInputChange = (field: keyof LocationFormData, value: string) => {
    setLocationData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <Card className="border-0 bg-transparent p-0 shadow-none">
      <div className="grid gap-4">
        {/* Address */}
        <Input
          type="text"
          placeholder="Street Address (e.g., 123 Main Street)"
          value={locationData.address}
          onChange={(e) => handleInputChange("address", e.target.value)}
          className="w-full"
        />

        {/* City and State Row */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            type="text"
            placeholder="City (e.g., New York)"
            value={locationData.city}
            onChange={(e) => handleInputChange("city", e.target.value)}
          />

          <Input
            type="text"
            placeholder="State/Province (e.g., NY)"
            value={locationData.state}
            onChange={(e) => handleInputChange("state", e.target.value)}
          />
        </div>

        {/* Country */}
        <Input
          type="text"
          placeholder="Country (e.g., United States)"
          value={locationData.country}
          onChange={(e) => handleInputChange("country", e.target.value)}
          className="w-full"
        />
      </div>
    </Card>
  )
}
