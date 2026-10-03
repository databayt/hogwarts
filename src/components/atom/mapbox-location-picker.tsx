"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { Command as CommandPrimitive } from "cmdk"
import {
  Building2,
  Hash,
  Loader2,
  LocateFixed,
  MapPin,
  Navigation,
  Search,
  X,
} from "lucide-react"
import mapboxgl from "mapbox-gl"
import { preconnect } from "react-dom"

import {
  isValidCoord,
  resolveMapBias,
  type MapBias,
  type SchoolGeo,
} from "@/lib/map-bias"
import type { LocationResult, PlaceSuggestion, PlaceType } from "@/lib/mapbox"
import { cn } from "@/lib/utils"
import { useMapboxSearch } from "@/hooks/use-mapbox-search"
import { useReverseGeocode } from "@/hooks/use-reverse-geocode"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useSchoolGeo } from "@/components/atom/school-geo"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { useLocale } from "@/components/internationalization/use-locale"

import "mapbox-gl/dist/mapbox-gl.css"

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""

// Arabic shaping + bidi. Mapbox GL still needs this plugin in v3: without it
// Arabic labels render as isolated letters in reversed order. Signature is
// (url, callback, deferred) — this file used to pass `true` as the CALLBACK.
// Loaded eagerly (deferred=false): Arabic is the default locale.
const RTL_PLUGIN_URL =
  "https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.3.0/mapbox-gl-rtl-text.js"

/**
 * Arm the RTL plugin before every map is created, not once per module.
 *
 * WHY: the plugin status is GLOBAL, and mapbox-gl (3.32) flips it to "error"
 * on ANY sync failure — including "Actor removed", which is just a map being
 * unmounted mid-load (leaving a wizard step, a fast re-render). From then on
 * every new map in the tab rendered Arabic as reversed, disconnected letters:
 * the intermittent bug. "error" is the one state setRTLTextPlugin may be
 * called again from, so re-arming heals it.
 */
function ensureRtlTextPlugin(): void {
  const status = mapboxgl.getRTLTextPluginStatus()
  if (status !== "unavailable" && status !== "error") return
  try {
    mapboxgl.setRTLTextPlugin(
      RTL_PLUGIN_URL,
      (error) => {
        if (error && error.name !== "AbortError") {
          console.warn("[map] RTL text plugin failed to load", error)
        }
      },
      false
    )
  } catch {
    // Another map armed it between the status read and this call
  }
}

const PIN_SVG =
  '<svg viewBox="0 0 24 32" width="32" height="42" aria-hidden="true"><path fill="currentColor" d="M12 0C5.4 0 0 5.2 0 11.7 0 20.4 12 32 12 32s12-11.6 12-20.3C24 5.2 18.6 0 12 0z"/><circle cx="12" cy="11.5" r="4.5" fill="white"/></svg>'
const SCHOOL_SVG =
  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21.42 10.92a1 1 0 0 0-.02-1.84L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.83l8.57 3.91a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>'

type Labels = {
  searchAddress: string
  useCurrentLocation: string
  locating: string
  noResults: string
  searching: string
  clear: string
  details: string
  detailsPlaceholder: string
  dragToAdjust: string
  tapToPin: string
  detectingAddress: string
  school: string
  zoomIn: string
  zoomOut: string
  twoFingerHint: string
  ctrlScrollHint: string
  ctrlScrollHintMac: string
  mapboxNotConfigured: string
  locationBlocked: string
  locationDenied: string
  locationTimeout: string
}

const EN_FALLBACK: Labels = {
  searchAddress: "Search a neighborhood, street or place",
  useCurrentLocation: "Use my current location",
  locating: "Finding your location…",
  noResults: "No match — tap the map to drop the pin where you are",
  searching: "Searching…",
  clear: "Clear",
  details: "Address",
  detailsPlaceholder: "Add house no., street or nearest landmark",
  dragToAdjust: "Drag the pin to adjust",
  tapToPin: "Tap the map to place the pin",
  detectingAddress: "Detecting address…",
  school: "School",
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
  twoFingerHint: "Use two fingers to move the map",
  ctrlScrollHint: "Use ctrl + scroll to zoom the map",
  ctrlScrollHintMac: "Use ⌘ + scroll to zoom the map",
  mapboxNotConfigured: "Map is not configured",
  locationBlocked: "Location access is blocked.",
  locationDenied: "Location access was denied.",
  locationTimeout: "Could not get your location.",
}

interface MapboxLocationPickerProps {
  value?: LocationResult | null
  onChange: (result: LocationResult) => void
  /** Overrides the school-derived starting view and search bias. */
  bias?: Partial<MapBias>
  /** The school's point when there is no tenant context (onboarding). */
  school?: SchoolGeo | null
  /** @deprecated wording comes from `school.locationPicker`; kept as a fallback */
  placeholder?: string
  /** Fallbacks only — the shared `school.locationPicker` dictionary wins. */
  labels?: Partial<Labels>
  className?: string
  mapHeight?: number
  /** Draw the school as a reference marker. Off when the pin IS the school. */
  showSchool?: boolean
}

const TYPE_ICON: Partial<Record<PlaceType, typeof MapPin>> = {
  address: Hash,
  street: Navigation,
  neighborhood: Building2,
  locality: Building2,
  district: Building2,
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
}

/** A circle polygon for the GPS accuracy halo. */
function circlePolygon(
  lng: number,
  lat: number,
  radiusMeters: number
): GeoJSON.Feature<GeoJSON.Polygon> {
  const points = 48
  const dLat = radiusMeters / 111_320
  const dLng = radiusMeters / (111_320 * Math.cos((lat * Math.PI) / 180))
  const ring: [number, number][] = []
  for (let i = 0; i <= points; i++) {
    const a = (i / points) * 2 * Math.PI
    ring.push([lng + dLng * Math.cos(a), lat + dLat * Math.sin(a)])
  }
  return {
    type: "Feature",
    properties: {},
    geometry: { type: "Polygon", coordinates: [ring] },
  }
}

export function MapboxLocationPicker({
  value,
  onChange,
  bias: biasOverride,
  school: schoolProp,
  placeholder,
  labels,
  className,
  mapHeight = 320,
  showSchool = true,
}: MapboxLocationPickerProps) {
  preconnect("https://api.mapbox.com")

  const { locale } = useLocale()
  const language = locale === "ar" ? "ar" : "en"
  const { dictionary } = useDictionary()
  const dict = (
    dictionary?.school as { locationPicker?: Partial<Labels> } | undefined
  )?.locationPicker
  const t: Labels = {
    ...EN_FALLBACK,
    ...Object.fromEntries(
      Object.entries(labels ?? {}).filter(([, v]) => Boolean(v))
    ),
    ...(placeholder && !dict ? { searchAddress: placeholder } : {}),
    ...dict,
  }

  const schoolContext = useSchoolGeo()
  const resolved = resolveMapBias({
    value,
    school: schoolProp ?? schoolContext,
  })
  const bias: MapBias & { hasPin: boolean } = { ...resolved, ...biasOverride }

  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const pinRef = useRef<mapboxgl.Marker | null>(null)
  const schoolMarkerRef = useRef<mapboxgl.Marker | null>(null)
  const landedKeyRef = useRef<string>("")
  const addressEditedRef = useRef(false)

  const [mapReady, setMapReady] = useState(false)
  const [open, setOpen] = useState(false)
  const [locating, setLocating] = useState(false)
  const [geoError, setGeoError] = useState("")
  const [addressDraft, setAddressDraft] = useState(value?.address ?? "")

  const { query, setQuery, results, loading, clearResults } = useMapboxSearch(
    200,
    language,
    { country: bias.country, proximity: bias.proximity },
    open
  )
  const { geocode, loading: geocodeLoading } = useReverseGeocode(language)

  // Keep the editable address line in step with outside changes (a new pick,
  // a form reset) — but never clobber what the user is typing into it.
  useEffect(() => {
    setAddressDraft(value?.address ?? "")
    addressEditedRef.current = false
  }, [value?.address])

  // ---------------------------------------------------------------- camera

  /** Fly to a point at once — never waits on the network. */
  const landAt = useCallback((lng: number, lat: number, zoom?: number) => {
    const map = mapRef.current
    if (!map) return
    landedKeyRef.current = `${lat.toFixed(6)},${lng.toFixed(6)}`
    const target = { center: [lng, lat] as [number, number] }
    const targetZoom = zoom ?? Math.max(map.getZoom(), 16)
    if (prefersReducedMotion()) {
      map.jumpTo({ ...target, zoom: targetZoom })
    } else {
      map.flyTo({
        ...target,
        zoom: targetZoom,
        speed: 1.4,
        curve: 1.42,
        essential: true,
      })
    }
  }, [])

  /** Place (or move) the single draggable pin, with a small drop. */
  const placePin = useCallback((lng: number, lat: number) => {
    const map = mapRef.current
    if (!map) return
    if (!pinRef.current) {
      const el = document.createElement("div")
      el.className = "text-primary cursor-grab active:cursor-grabbing"
      el.innerHTML = `<div class="location-pin-drop drop-shadow-md">${PIN_SVG}</div>`
      const marker = new mapboxgl.Marker({
        element: el,
        anchor: "bottom",
        draggable: true,
      })
        .setLngLat([lng, lat])
        .addTo(map)
      marker.on("dragend", () => {
        const p = marker.getLngLat()
        onPointPicked(p.lat, p.lng, { fly: false })
      })
      pinRef.current = marker
      return
    }
    pinRef.current.setLngLat([lng, lat])
    // Replay the drop on the inner element
    const inner = pinRef.current
      .getElement()
      .querySelector<HTMLElement>(".location-pin-drop")
    if (inner) {
      inner.classList.remove("location-pin-drop")
      void inner.offsetWidth
      inner.classList.add("location-pin-drop")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onPointPicked is stable (ref-backed) and declared below
  }, [])

  const setAccuracyHalo = useCallback(
    (lng?: number, lat?: number, accuracy?: number) => {
      const map = mapRef.current
      if (!map || !map.isStyleLoaded()) return
      const source = map.getSource("pin-accuracy") as
        | mapboxgl.GeoJSONSource
        | undefined
      const data: GeoJSON.FeatureCollection =
        lng != null && lat != null && accuracy && accuracy > 50
          ? {
              type: "FeatureCollection",
              features: [circlePolygon(lng, lat, Math.min(accuracy, 3000))],
            }
          : { type: "FeatureCollection", features: [] }
      if (source) {
        source.setData(data)
        return
      }
      map.addSource("pin-accuracy", { type: "geojson", data })
      map.addLayer({
        id: "pin-accuracy-fill",
        type: "fill",
        source: "pin-accuracy",
        paint: { "fill-color": "#3b82f6", "fill-opacity": 0.12 },
      })
      map.addLayer({
        id: "pin-accuracy-line",
        type: "line",
        source: "pin-accuracy",
        paint: {
          "line-color": "#3b82f6",
          "line-opacity": 0.4,
          "line-width": 1,
        },
      })
    },
    []
  )

  // ------------------------------------------------------ picking a point

  /**
   * A point chosen on the map (tap, drag, GPS). The pin moves and the camera
   * lands immediately; the address arrives when reverse geocoding answers.
   */
  const pickPoint = async (
    lat: number,
    lng: number,
    opts: { fly?: boolean } = {}
  ) => {
    placePin(lng, lat)
    if (opts.fly !== false) landAt(lng, lat)
    setGeoError("")

    const result = await geocode(lat, lng)
    if (result === "superseded") return
    const next: LocationResult = result ?? {
      latitude: lat,
      longitude: lng,
      address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      city: "",
      state: "",
      country: "",
      postalCode: "",
    }
    // A small drag after the user typed a house number or landmark keeps
    // their words; only the pin and the area fields move.
    if (addressEditedRef.current && addressDraft.trim()) {
      next.address = addressDraft.trim()
    }
    onChange(next)
  }
  // Marker drag, map click and GPS callbacks outlive the render that bound
  // them; route them through a ref so they always see the latest props.
  const pickPointRef = useRef(pickPoint)
  useEffect(() => {
    pickPointRef.current = pickPoint
  })
  const onPointPicked = useCallback(
    (lat: number, lng: number, opts?: { fly?: boolean }) =>
      pickPointRef.current(lat, lng, opts),
    []
  )

  const handleSelect = useCallback(
    (suggestion: PlaceSuggestion) => {
      const { location } = suggestion
      placePin(location.longitude, location.latitude)
      const zoom =
        suggestion.type === "address" || suggestion.type === "street"
          ? 17
          : suggestion.type === "neighborhood" || suggestion.type === "locality"
            ? 15
            : 13
      landAt(location.longitude, location.latitude, zoom)
      setAccuracyHalo()
      setGeoError("")
      setOpen(false)
      setQuery(suggestion.name)
      clearResults()
      addressEditedRef.current = false
      onChange(location)
    },
    [placePin, landAt, setAccuracyHalo, setQuery, clearResults, onChange]
  )

  // ----------------------------------------------------- current location

  const handleGps = useCallback(async () => {
    setOpen(false)
    setGeoError("")
    if (!navigator.geolocation) {
      setGeoError(t.locationTimeout)
      return
    }
    try {
      const permission = await navigator.permissions.query({
        name: "geolocation",
      })
      if (permission.state === "denied") {
        setGeoError(t.locationBlocked)
        return
      }
    } catch {
      // Permissions API unsupported — just ask
    }

    setLocating(true)
    const onFix = (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = position.coords
      setLocating(false)
      setAccuracyHalo(longitude, latitude, accuracy)
      onPointPicked(latitude, longitude)
    }

    // Last resort when the OS has no positioning (Location Services off,
    // desktop without Wi-Fi scan): city-level IP location. Better than a dead
    // button — the user refines by dragging the pin.
    const tryIpFallback = async (): Promise<boolean> => {
      try {
        const res = await fetch("https://ipwho.is/", {
          signal: AbortSignal.timeout(5000),
        })
        if (!res.ok) return false
        const data = (await res.json()) as {
          success?: boolean
          latitude?: number
          longitude?: number
        }
        if (
          data.success &&
          isValidCoord(data.latitude ?? null, data.longitude ?? null)
        ) {
          onPointPicked(data.latitude as number, data.longitude as number)
          return true
        }
      } catch {
        // network / CORS / timeout
      }
      return false
    }

    navigator.geolocation.getCurrentPosition(
      onFix,
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocating(false)
          setGeoError(t.locationDenied)
          return
        }
        // High accuracy often times out on desktops — retry coarse, then IP
        navigator.geolocation.getCurrentPosition(
          onFix,
          async () => {
            const ok = await tryIpFallback()
            setLocating(false)
            if (!ok) setGeoError(t.locationTimeout)
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
        )
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    )
  }, [
    t.locationBlocked,
    t.locationDenied,
    t.locationTimeout,
    setAccuracyHalo,
    onPointPicked,
  ])

  // ------------------------------------------------------------- the map

  const onMapClick = useCallback(
    (lat: number, lng: number) => {
      setAccuracyHalo()
      onPointPicked(lat, lng, { fly: true })
    },
    [setAccuracyHalo, onPointPicked]
  )

  // Create the map once. The starting view comes from the saved pin, else the
  // school, else the school's country, else Khartoum — never 0,0.
  const initialView = useRef({
    center: bias.center,
    zoom: bias.zoom,
    language,
  })
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !MAPBOX_TOKEN) return
    mapboxgl.accessToken = MAPBOX_TOKEN
    ensureRtlTextPlugin()

    const coarsePointer = window.matchMedia("(pointer: coarse)").matches
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/standard",
      center: initialView.current.center,
      zoom: initialView.current.zoom,
      language: initialView.current.language,
      projection: "mercator",
      // Embedded in a scrolling form: on phones one finger scrolls the page,
      // two move the map, so the map never traps the scroll.
      cooperativeGestures: coarsePointer,
      attributionControl: false,
      locale: {
        "TouchPanBlocker.Message": t.twoFingerHint,
        "NavigationControl.ZoomIn": t.zoomIn,
        "NavigationControl.ZoomOut": t.zoomOut,
        "ScrollZoomBlocker.CtrlMessage": t.ctrlScrollHint,
        "ScrollZoomBlocker.CmdMessage": t.ctrlScrollHintMac,
      },
      config: {
        basemap: {
          theme: "faded",
          lightPreset: "day",
          // Landmarks are how addresses are given in Khartoum
          showPointOfInterestLabels: true,
          showTransitLabels: false,
          showPedestrianRoads: false,
          show3dObjects: false,
          showPlaceLabels: true,
          showRoadLabels: true,
        },
      },
    })
    map.addControl(new mapboxgl.AttributionControl({ compact: true }))
    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "top-left"
    )

    map.on("style.load", () => {
      map.setLanguage(initialView.current.language)
    })
    map.on("load", () => setMapReady(true))
    map.on("click", (e) => onMapClick(e.lngLat.lat, e.lngLat.lng))

    mapRef.current = map
    return () => {
      pinRef.current?.remove()
      pinRef.current = null
      schoolMarkerRef.current?.remove()
      schoolMarkerRef.current = null
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- created once; labels/locale follow below
  }, [])

  // Follow a locale switch without rebuilding the map
  useEffect(() => {
    if (!mapReady) return
    mapRef.current?.setLanguage(language)
  }, [language, mapReady])

  // The school as a reference point, so a child's home is pinned "around" it
  const schoolLng = bias.school?.[0]
  const schoolLat = bias.school?.[1]
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    if (!showSchool || schoolLng == null || schoolLat == null) {
      schoolMarkerRef.current?.remove()
      schoolMarkerRef.current = null
      return
    }
    if (!schoolMarkerRef.current) {
      const el = document.createElement("div")
      el.className =
        "bg-primary text-primary-foreground ring-background pointer-events-none flex size-7 items-center justify-center rounded-full shadow-md ring-2"
      el.innerHTML = SCHOOL_SVG
      el.setAttribute("aria-label", t.school)
      el.title = t.school
      schoolMarkerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat([schoolLng, schoolLat])
        .addTo(map)
    } else {
      schoolMarkerRef.current.setLngLat([schoolLng, schoolLat])
    }
  }, [mapReady, showSchool, schoolLng, schoolLat, t.school])

  // Outside value changes (initial load, form reset, another field) move the
  // pin; changes this component made already flew there.
  const valueLat = value?.latitude
  const valueLng = value?.longitude
  useEffect(() => {
    if (!mapReady) return
    if (!isValidCoord(valueLat, valueLng)) return
    const lat = valueLat as number
    const lng = valueLng as number
    placePin(lng, lat)
    const key = `${lat.toFixed(6)},${lng.toFixed(6)}`
    if (landedKeyRef.current !== key) landAt(lng, lat)
  }, [valueLat, valueLng, mapReady, placePin, landAt])

  // ----------------------------------------------------------------- UI

  if (!MAPBOX_TOKEN) {
    return (
      <div className="text-muted-foreground text-sm">
        {t.mapboxNotConfigured}
      </div>
    )
  }

  const hasPin = isValidCoord(valueLat, valueLng)
  const showGpsRow = query.trim().length < 2
  const showEmpty =
    !showGpsRow && !loading && results.length === 0 && query.trim().length >= 2

  return (
    <div className={cn("space-y-3", className)}>
      <Command
        shouldFilter={false}
        className="relative z-10 overflow-visible bg-transparent"
        loop
      >
        <div className="border-input bg-background focus-within:ring-ring/50 focus-within:border-ring flex items-center rounded-md border transition-shadow focus-within:ring-[3px]">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="group h-10 w-10 shrink-0 rounded-none rounded-s-md"
            onClick={handleGps}
            disabled={locating}
            aria-label={t.useCurrentLocation}
            title={t.useCurrentLocation}
          >
            {locating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <LocateFixed className="text-muted-foreground group-hover:text-foreground size-4 transition-colors" />
            )}
          </Button>
          <div className="bg-border h-6 w-px" />
          <CommandPrimitive.Input
            value={query}
            onValueChange={(v) => {
              setQuery(v)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false)
            }}
            placeholder={t.searchAddress}
            aria-label={t.searchAddress}
            dir="auto"
            className="placeholder:text-muted-foreground h-10 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
          />
          {loading ? (
            <Loader2 className="text-muted-foreground me-3 size-4 shrink-0 animate-spin" />
          ) : query.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="me-1 size-8 shrink-0"
              onClick={() => {
                setQuery("")
                clearResults()
              }}
              aria-label={t.clear}
            >
              <X className="size-4" />
            </Button>
          ) : (
            <Search className="text-muted-foreground me-3 size-4 shrink-0" />
          )}
        </div>

        {open && (
          <div
            className="bg-popover text-popover-foreground border-border absolute inset-x-0 top-full mt-1 overflow-hidden rounded-md border shadow-md"
            // Keep focus in the input while clicking a row
            onMouseDown={(e) => e.preventDefault()}
          >
            <CommandList className="max-h-72">
              {showGpsRow && (
                <CommandGroup>
                  <CommandItem value="__gps" onSelect={handleGps}>
                    <LocateFixed className="text-primary" />
                    <span>{t.useCurrentLocation}</span>
                  </CommandItem>
                </CommandGroup>
              )}
              {!showGpsRow && loading && results.length === 0 && (
                <div className="space-y-2 p-2" aria-label={t.searching}>
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-4/5" />
                  <Skeleton className="h-9 w-3/5" />
                </div>
              )}
              {showEmpty && (
                <p className="text-muted-foreground px-3 py-4 text-center text-sm">
                  {t.noResults}
                </p>
              )}
              {!showGpsRow && results.length > 0 && (
                <CommandGroup>
                  {results.map((s) => {
                    const Icon = TYPE_ICON[s.type] ?? MapPin
                    return (
                      <CommandItem
                        key={s.id}
                        value={s.id}
                        onSelect={() => handleSelect(s)}
                        className="items-start gap-3 py-2"
                      >
                        <Icon className="mt-0.5" />
                        <span className="min-w-0 flex-1" dir="auto">
                          <span className="block truncate font-medium">
                            {s.name}
                          </span>
                          {s.context && (
                            <span className="text-muted-foreground block truncate text-xs">
                              {s.context}
                            </span>
                          )}
                        </span>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </div>
        )}
      </Command>

      {geoError && (
        <p className="text-destructive text-sm" role="alert">
          {geoError}
        </p>
      )}

      <div
        className="bg-muted relative overflow-hidden rounded-xl"
        style={{ height: mapHeight }}
      >
        <div ref={mapContainerRef} className="h-full w-full" />
        {!mapReady && <Skeleton className="absolute inset-0 rounded-xl" />}
        {mapReady && <MapHint>{hasPin ? t.dragToAdjust : t.tapToPin}</MapHint>}
      </div>

      {(hasPin || geocodeLoading || Boolean(value?.address)) && (
        <div className="space-y-1.5">
          <label
            htmlFor="location-picker-address"
            className="text-muted-foreground flex items-center gap-1.5 text-xs"
          >
            <MapPin className="text-primary size-3.5" />
            {geocodeLoading ? t.detectingAddress : t.details}
          </label>
          <Input
            id="location-picker-address"
            // Page direction, not "auto": Sudanese results mix scripts
            // ("Al Busta South، أم درمان…") and auto flips on the first word
            dir={language === "ar" ? "rtl" : "ltr"}
            value={addressDraft}
            disabled={geocodeLoading}
            placeholder={t.detailsPlaceholder}
            onChange={(e) => {
              addressEditedRef.current = true
              setAddressDraft(e.target.value)
            }}
            onBlur={() => {
              const next = addressDraft.trim()
              if (!value || !next || next === value.address) return
              onChange({ ...value, address: next })
            }}
          />
          {(value?.city || value?.state || value?.country) && (
            <p className="text-muted-foreground text-xs" dir="auto">
              {[value?.city, value?.state, value?.country]
                .filter((part, i, all) => part && all.indexOf(part) === i)
                .join(language === "ar" ? "، " : ", ")}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function MapHint({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center">
      <span className="bg-background/90 text-muted-foreground rounded-full px-3 py-1 text-xs shadow-sm backdrop-blur">
        {children}
      </span>
    </div>
  )
}
