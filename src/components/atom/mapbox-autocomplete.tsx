"use client"

import { useEffect, useRef, useState } from "react"
import { MapPin } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

// Mapbox CSS (imported dynamically with component)
import "mapbox-gl/dist/mapbox-gl.css"
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css"

export interface LocationResult {
  address: string
  city: string
  state: string
  country: string
  postalCode: string
  latitude: number
  longitude: number
}

interface MapboxAutocompleteProps {
  value?: string
  onSelect: (result: LocationResult) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function MapboxAutocomplete({
  value,
  onSelect,
  placeholder = "Search for an address...",
  className,
  disabled,
}: MapboxAutocompleteProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const geocoderRef = useRef<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) {
      setError("Mapbox token not configured")
      return
    }

    // Dynamic import to avoid SSR issues
    const loadMapbox = async () => {
      try {
        const mapboxgl = (await import("mapbox-gl")).default
        const MapboxGeocoder = (await import("@mapbox/mapbox-gl-geocoder"))
          .default

        mapboxgl.accessToken = token

        // Clear container if geocoder exists
        if (geocoderRef.current) {
          geocoderRef.current.onRemove()
        }

        const geocoder = new MapboxGeocoder({
          accessToken: token,
          types: "address,place,locality,postcode",
          placeholder,
          marker: false,
          mapboxgl: mapboxgl as any,
        })

        geocoder.addTo(containerRef.current!)
        geocoderRef.current = geocoder

        // Handle selection
        geocoder.on("result", (e: any) => {
          const { result } = e
          const context = result.context || []

          // Parse context to extract location components
          const findContext = (prefix: string) =>
            context.find((c: any) => c.id?.startsWith(prefix))?.text || ""

          const locationResult: LocationResult = {
            address: result.place_name || "",
            city:
              findContext("place") ||
              findContext("locality") ||
              result.text ||
              "",
            state: findContext("region"),
            country: findContext("country"),
            postalCode: findContext("postcode"),
            latitude: result.center?.[1] || 0,
            longitude: result.center?.[0] || 0,
          }

          onSelect(locationResult)
        })

        // Handle clear
        geocoder.on("clear", () => {
          onSelect({
            address: "",
            city: "",
            state: "",
            country: "",
            postalCode: "",
            latitude: 0,
            longitude: 0,
          })
        })

        // Set initial value if provided
        if (value) {
          geocoder.setInput(value)
        }

        setIsLoaded(true)
      } catch (err) {
        console.error("Failed to load Mapbox:", err)
        setError("Failed to load location search")
      }
    }

    loadMapbox()

    return () => {
      if (geocoderRef.current) {
        try {
          geocoderRef.current.onRemove()
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  }, [placeholder, onSelect])

  // Update input when value changes externally
  useEffect(() => {
    if (geocoderRef.current && value !== undefined && isLoaded) {
      geocoderRef.current.setInput(value)
    }
  }, [value, isLoaded])

  if (error) {
    return (
      <div className="space-y-2">
        <div className="text-destructive text-sm">{error}</div>
        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) =>
            onSelect({
              address: e.target.value,
              city: "",
              state: "",
              country: "",
              postalCode: "",
              latitude: 0,
              longitude: 0,
            })
          }
          disabled={disabled}
          className={className}
        />
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn("mapbox-geocoder-wrapper", className)}
      style={
        {
          "--mapbox-input-height": "40px",
        } as React.CSSProperties
      }
    />
  )
}
