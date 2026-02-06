"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Loader2, MapPin, Navigation, Search, X } from "lucide-react"
import mapboxgl from "mapbox-gl"

import {
  featureToLocationResult,
  type LocationResult,
  type MapboxFeature,
} from "@/lib/mapbox"
import { cn } from "@/lib/utils"
import { useMapboxSearch } from "@/hooks/use-mapbox-search"
import { useReverseGeocode } from "@/hooks/use-reverse-geocode"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import "mapbox-gl/dist/mapbox-gl.css"

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""

// Default center (world view)
const DEFAULT_CENTER: [number, number] = [0, 20]
const DEFAULT_ZOOM = 2

interface MapboxLocationPickerProps {
  value?: LocationResult | null
  onChange: (result: LocationResult) => void
  placeholder?: string
  className?: string
  mapHeight?: number
}

export function MapboxLocationPicker({
  value,
  onChange,
  placeholder = "Search for an address...",
  className,
  mapHeight = 320,
}: MapboxLocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markerRef = useRef<mapboxgl.Marker | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)

  const {
    query,
    setQuery,
    results,
    loading: searchLoading,
    clearResults,
  } = useMapboxSearch()
  const { geocode, loading: geocodeLoading } = useReverseGeocode()

  // Stable ref for onChange to avoid map re-init
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  // Handle map click or marker drag → reverse geocode
  const handleMapLocationChange = useCallback(
    async (lat: number, lng: number) => {
      const result = await geocode(lat, lng)
      if (result) {
        onChangeRef.current(result)
      }
    },
    [geocode]
  )

  // Stable ref for the location handler
  const handleMapLocationChangeRef = useRef(handleMapLocationChange)
  useEffect(() => {
    handleMapLocationChangeRef.current = handleMapLocationChange
  }, [handleMapLocationChange])

  // Initialize map (once)
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !MAPBOX_TOKEN) return

    mapboxgl.accessToken = MAPBOX_TOKEN

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: value ? [value.longitude, value.latitude] : DEFAULT_CENTER,
      zoom: value ? 15 : DEFAULT_ZOOM,
    })

    map.addControl(new mapboxgl.NavigationControl(), "top-right")

    map.on("load", () => {
      setMapReady(true)
    })

    map.on("click", (e) => {
      handleMapLocationChangeRef.current(e.lngLat.lat, e.lngLat.lng)
    })

    mapRef.current = map

    return () => {
      if (markerRef.current) {
        markerRef.current.remove()
        markerRef.current = null
      }
      map.remove()
      mapRef.current = null
    }
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update marker when value changes
  useEffect(() => {
    if (!mapRef.current || !mapReady) return

    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.remove()
      markerRef.current = null
    }

    if (value?.latitude && value?.longitude) {
      const marker = new mapboxgl.Marker({ draggable: true, color: "#FF385C" })
        .setLngLat([value.longitude, value.latitude])
        .addTo(mapRef.current)

      marker.on("dragend", () => {
        const lngLat = marker.getLngLat()
        handleMapLocationChangeRef.current(lngLat.lat, lngLat.lng)
      })

      markerRef.current = marker

      mapRef.current.flyTo({
        center: [value.longitude, value.latitude],
        zoom: 15,
      })
    }
  }, [value?.latitude, value?.longitude, mapReady])

  // Handle search result selection
  const handleSelectResult = useCallback(
    (feature: MapboxFeature) => {
      const result = featureToLocationResult(feature)
      onChange(result)
      clearResults()
      setShowResults(false)
    },
    [onChange, clearResults]
  )

  // Handle GPS location
  const handleGps = useCallback(() => {
    if (!navigator.geolocation) return
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await handleMapLocationChange(
          position.coords.latitude,
          position.coords.longitude
        )
        setGpsLoading(false)
      },
      () => {
        setGpsLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [handleMapLocationChange])

  // Handle search input change
  const handleQueryChange = useCallback(
    (val: string) => {
      setQuery(val)
      setShowResults(true)
    },
    [setQuery]
  )

  const handleClear = useCallback(() => {
    clearResults()
    setShowResults(false)
  }, [clearResults])

  const displayResults = showResults && results.length > 0 && query.length >= 2

  if (!MAPBOX_TOKEN) {
    return (
      <div className="text-muted-foreground text-sm">
        Mapbox token not configured
      </div>
    )
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Search Input with GPS button */}
      <div className="relative z-10">
        <div className="border-input flex items-center rounded-md border">
          {/* GPS Button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0 rounded-none rounded-l-md"
            onClick={handleGps}
            disabled={gpsLoading}
          >
            {gpsLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
          </Button>

          {/* Divider */}
          <div className="bg-border h-6 w-px" />

          {/* Search Input */}
          <div className="relative flex-1">
            <Input
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder={placeholder}
              className="border-0 shadow-none focus-visible:ring-0"
            />
          </div>

          {/* Right icons */}
          {searchLoading && (
            <Loader2 className="text-muted-foreground mr-3 h-4 w-4 animate-spin" />
          )}
          {query.length > 0 && !searchLoading && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mr-1 h-8 w-8"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          {query.length === 0 && !searchLoading && (
            <Search className="text-muted-foreground mr-3 h-4 w-4" />
          )}
        </div>

        {/* Results Dropdown */}
        {displayResults && (
          <div className="bg-popover border-border absolute top-full right-0 left-0 z-20 mt-1 max-h-48 overflow-auto rounded-md border shadow-md">
            {results.map((feature) => (
              <button
                key={feature.id}
                type="button"
                className="hover:bg-accent flex w-full items-start gap-2 px-3 py-2 text-left"
                onClick={() => handleSelectResult(feature)}
              >
                <MapPin className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                <span className="text-sm">{feature.place_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div
        className="relative overflow-hidden rounded-xl"
        style={{ height: mapHeight }}
      >
        <div ref={mapContainerRef} className="h-full w-full" />

        {/* Tap hint when no pin */}
        {!value?.latitude && !value?.longitude && mapReady && (
          <div className="bg-background/90 pointer-events-none absolute top-3 right-3 left-3 rounded-lg px-3 py-2 text-center">
            <p className="text-muted-foreground text-xs">
              Tap on the map to place a pin
            </p>
          </div>
        )}
      </div>

      {/* Address Preview */}
      {(value?.address || geocodeLoading) && (
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          <div className="min-w-0 flex-1">
            {geocodeLoading ? (
              <p className="text-muted-foreground text-sm">
                Detecting address...
              </p>
            ) : (
              <>
                <p className="truncate text-sm font-medium">{value?.address}</p>
                {(value?.city || value?.state || value?.country) && (
                  <p className="text-muted-foreground text-xs">
                    {[value?.city, value?.state, value?.country]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
