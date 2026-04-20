"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useRef, useState } from "react"
import { Loader2, MapPin, Search, X } from "lucide-react"
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
import { Skeleton } from "@/components/ui/skeleton"
import { useLocale } from "@/components/internationalization/use-locale"

import "mapbox-gl/dist/mapbox-gl.css"

// Load RTL text plugin at module level — MUST happen before any map instance
// renders Arabic/Hebrew text, otherwise letters appear disconnected
try {
  const status = (mapboxgl as any).getRTLTextPluginStatus?.()
  if (!status || status === "unavailable") {
    ;(mapboxgl as any).setRTLTextPlugin(
      "https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.3.0/mapbox-gl-rtl-text.js",
      true
    )
  }
} catch {
  // Plugin may already be loaded
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""

// Default center (world view)
const DEFAULT_CENTER: [number, number] = [0, 20]
const DEFAULT_ZOOM = 1.2

interface MapboxLocationPickerProps {
  value?: LocationResult | null
  onChange: (result: LocationResult) => void
  placeholder?: string
  labels?: {
    tapToPin?: string
    detectingAddress?: string
    mapboxNotConfigured?: string
    locationBlocked?: string
    locationDenied?: string
    locationTimeout?: string
  }
  className?: string
  mapHeight?: number
}

export function MapboxLocationPicker({
  value,
  onChange,
  placeholder = "Search for an address...",
  labels,
  className,
  mapHeight = 320,
}: MapboxLocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markerRef = useRef<mapboxgl.Marker | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)

  const { locale } = useLocale()
  const {
    query,
    setQuery,
    results,
    loading: searchLoading,
    clearResults,
  } = useMapboxSearch(300, locale)
  const { geocode, loading: geocodeLoading } = useReverseGeocode(locale)

  // Stable ref for onChange to avoid map re-init
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  // Handle map click or marker drag → reverse geocode
  const handleMapLocationChange = useCallback(
    async (lat: number, lng: number) => {
      const result = await geocode(lat, lng)
      // Fallback to raw coordinates if reverse geocoding fails, so the
      // picker still reflects the user's location instead of doing nothing.
      onChangeRef.current(
        result ?? {
          latitude: lat,
          longitude: lng,
          address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          city: "",
          state: "",
          country: "",
          postalCode: "",
        }
      )
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
      style: "mapbox://styles/mapbox/standard",
      center: value ? [value.longitude, value.latitude] : DEFAULT_CENTER,
      zoom: value ? 15 : DEFAULT_ZOOM,
      projection: "globe",
      attributionControl: false,
      locale: locale === "ar" ? { "Map.Title": "خريطة" } : undefined,
      config: {
        basemap: {
          theme: "faded",
          lightPreset: "day",
          showPointOfInterestLabels: false,
          showTransitLabels: false,
          showPedestrianRoads: false,
          show3dObjects: false,
          showPlaceLabels: true,
          showRoadLabels: true,
        },
      },
    })

    // Set map language for Arabic labels via Standard style config
    map.on("style.load", () => {
      try {
        map.setConfigProperty(
          "basemap",
          "language",
          locale === "ar" ? "ar" : "en"
        )
      } catch {
        // Fallback for non-Standard styles
        if (locale === "ar") {
          map.setLanguage?.("ar")
        }
      }
    })

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
  const handleGps = useCallback(async () => {
    if (!navigator.geolocation) return

    // Check/request permission first
    try {
      const permission = await navigator.permissions.query({
        name: "geolocation",
      })
      if (permission.state === "denied") {
        alert(
          labels?.locationBlocked ||
            "Location access is blocked. Please enable it in your browser settings."
        )
        return
      }
    } catch {
      // permissions API not supported, continue anyway
    }

    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await handleMapLocationChange(
          position.coords.latitude,
          position.coords.longitude
        )
        setGpsLoading(false)
      },
      (error) => {
        setGpsLoading(false)
        if (error.code === error.PERMISSION_DENIED) {
          alert(
            labels?.locationDenied ||
              "Location access denied. Please allow location in your browser settings."
          )
        } else {
          // POSITION_UNAVAILABLE or TIMEOUT — both surface the same user-facing
          // message ("couldn't get location, try again") so the button doesn't
          // appear inert on devices without a GPS fix.
          alert(
            labels?.locationTimeout ||
              "Could not get your location. Please try again."
          )
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
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
        {labels?.mapboxNotConfigured || "Mapbox token not configured"}
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
            className="group h-10 w-10 shrink-0 rounded-none rounded-s-md"
            onClick={handleGps}
            disabled={gpsLoading}
          >
            {gpsLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                className="text-muted-foreground group-hover:text-foreground h-4 w-4 transition-colors"
              >
                <path
                  fill="currentColor"
                  d="M12 8.25a3.75 3.75 0 1 0 0 7.5a3.75 3.75 0 0 0 0-7.5"
                />
                <path
                  fill="currentColor"
                  fillRule="evenodd"
                  d="M12 1.25a.75.75 0 0 1 .75.75v1.282a8.75 8.75 0 0 1 7.968 7.968H22a.75.75 0 0 1 0 1.5h-1.282a8.75 8.75 0 0 1-7.968 7.968V22a.75.75 0 0 1-1.5 0v-1.282a8.75 8.75 0 0 1-7.968-7.968H2a.75.75 0 0 1 0-1.5h1.282a8.75 8.75 0 0 1 7.968-7.968V2a.75.75 0 0 1 .75-.75M4.75 12a7.25 7.25 0 1 0 14.5 0a7.25 7.25 0 0 0-14.5 0"
                  clipRule="evenodd"
                />
              </svg>
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
            <Loader2 className="text-muted-foreground me-3 h-4 w-4 animate-spin" />
          )}
          {query.length > 0 && !searchLoading && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="me-1 h-8 w-8"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          {query.length === 0 && !searchLoading && (
            <Search className="text-muted-foreground me-3 h-4 w-4" />
          )}
        </div>

        {/* Results Dropdown */}
        {displayResults && (
          <div className="bg-popover border-border absolute start-0 end-0 top-full z-20 mt-1 max-h-48 overflow-auto rounded-md border shadow-md">
            {results.map((feature) => (
              <button
                key={feature.id}
                type="button"
                className="hover:bg-accent flex w-full items-start gap-2 px-3 py-2 text-start"
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

        {/* Skeleton overlay until map loads */}
        {!mapReady && <Skeleton className="absolute inset-0 rounded-xl" />}
      </div>

      {/* Address Preview */}
      {(value?.address || geocodeLoading) && (
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          <div className="min-w-0 flex-1">
            {geocodeLoading ? (
              <p className="text-muted-foreground text-sm">
                {labels?.detectingAddress || "Detecting address..."}
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
