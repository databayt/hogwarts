"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * GeoLiveMap - Admin/Teacher Live Location Map
 * Real-time student location tracking with Leaflet.js
 * Features: WebSocket updates, polling fallback, geofence visualization
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import dynamic from "next/dynamic"
import {
  CircleAlert,
  LoaderCircle,
  MapPin,
  RefreshCw,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SuccessToast } from "@/components/atom/toast"

import { phone } from "../shared/phone"
import { getLiveStudentLocations } from "./actions"

// Dynamically import Leaflet components (SSR compatibility)
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
)
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
})
const Circle = dynamic(
  () => import("react-leaflet").then((mod) => mod.Circle),
  { ssr: false }
)

// ============================================================================
// TYPES
// ============================================================================

interface StudentLocation {
  studentId: string
  studentName: string
  lat: number
  lon: number
  accuracy: number | null
  battery: number | null
  timestamp: Date
  currentGeofences: string[]
}

interface Geofence {
  id: string
  name: string
  type: string
  isActive: boolean
  centerLat: number | null
  centerLon: number | null
  radiusMeters: number | null
  color: string | null
}

interface GeoLiveMapProps {
  schoolId: string
  initialLocations?: StudentLocation[]
  initialGeofences?: Geofence[]
  center?: [number, number] // Default map center [lat, lon]
  zoom?: number // Default zoom level
  pollingInterval?: number // Fallback polling interval (ms, default: 10000)
  useWebSocket?: boolean // Opt in to WebSocket (no /api/geo/ws server exists yet)
  t?: Record<string, string>
}

// ============================================================================
// COMPONENT
// ============================================================================

export function GeoLiveMap({
  schoolId,
  initialLocations = [],
  initialGeofences = [],
  center = [24.7136, 46.6753], // Riyadh, Saudi Arabia default
  zoom = 13,
  pollingInterval = 10000, // 10 seconds
  useWebSocket = false,
  t = {},
}: GeoLiveMapProps) {
  const timeLocale = t.locale === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-US"

  // State
  const [locations, setLocations] =
    useState<StudentLocation[]>(initialLocations)
  const [geofences, setGeofences] = useState<Geofence[]>(initialGeofences)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [connectionType, setConnectionType] = useState<
    "websocket" | "polling" | null
  >(null)

  // Refs
  const wsRef = useRef<WebSocket | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)

  // ============================================================================
  // FETCH LOCATIONS (POLLING)
  // ============================================================================

  const fetchLocations = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // The server action shares the view roles with this page (the
      // /api/geo/live route answers ADMIN/TEACHER only).
      const result = await getLiveStudentLocations(5)
      if (result.success && result.data) {
        setLocations(
          result.data.map((loc) => ({
            ...loc,
            timestamp: new Date(loc.timestamp),
          }))
        )
        setLastUpdate(new Date())
      } else {
        throw new Error("fetch failed")
      }
    } catch (error) {
      console.error("Error fetching locations:", error)
      setError(t.fetchFailed ?? "Couldn't load locations")
    } finally {
      setIsLoading(false)
    }
  }, [schoolId])

  // ============================================================================
  // WEBSOCKET CONNECTION
  // ============================================================================

  const connectWebSocket = useCallback(() => {
    if (!useWebSocket) return

    try {
      // Close existing connection
      if (wsRef.current) {
        wsRef.current.close()
      }

      // Determine WebSocket URL
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
      const host = window.location.host
      const wsUrl = `${protocol}//${host}/api/geo/ws`

      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log("WebSocket connected")
        setIsConnected(true)
        setConnectionType("websocket")
        setError(null)
        reconnectAttemptsRef.current = 0

        // Subscribe to school's geofence channel
        ws.send(
          JSON.stringify({
            type: "subscribe",
            schoolId,
          })
        )
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)

          if (message.type === "welcome" || message.type === "subscribed") {
            console.log("WebSocket:", message)
            SuccessToast("Connected to live location updates")
          } else if (message.channel?.startsWith("geo_location_")) {
            // Real-time location update
            const locationData = message.data

            setLocations((prev) => {
              const existingIndex = prev.findIndex(
                (loc) => loc.studentId === locationData.studentId
              )

              if (existingIndex >= 0) {
                // Update existing student location
                const updated = [...prev]
                updated[existingIndex] = {
                  ...updated[existingIndex],
                  lat: locationData.lat,
                  lon: locationData.lon,
                  accuracy: locationData.accuracy,
                  battery: locationData.battery,
                  timestamp: new Date(locationData.timestamp),
                }
                return updated
              } else {
                // Add new student location
                return [
                  ...prev,
                  {
                    studentId: locationData.studentId,
                    studentName: "Student", // Will be populated on next full fetch
                    lat: locationData.lat,
                    lon: locationData.lon,
                    accuracy: locationData.accuracy,
                    battery: locationData.battery,
                    timestamp: new Date(locationData.timestamp),
                    currentGeofences: [],
                  },
                ]
              }
            })

            setLastUpdate(new Date())
          } else if (message.channel?.startsWith("geo_event_")) {
            // Geofence event (ENTER/EXIT)
            const eventData = message.data
            toast.info(
              `${eventData.studentName || "Student"} ${eventData.eventType.toLowerCase()}ed ${eventData.geofenceName || "geofence"}`
            )
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error)
        }
      }

      ws.onerror = (error) => {
        console.error("WebSocket error:", error)
        setError("WebSocket connection error")
      }

      ws.onclose = () => {
        console.log("WebSocket closed")
        setIsConnected(false)

        // Attempt reconnection with exponential backoff
        const delay = Math.min(
          1000 * Math.pow(2, reconnectAttemptsRef.current),
          30000
        )
        reconnectAttemptsRef.current++

        reconnectTimeoutRef.current = setTimeout(() => {
          console.log(
            `Reconnecting WebSocket (attempt ${reconnectAttemptsRef.current})...`
          )
          connectWebSocket()
        }, delay)

        // Fallback to polling
        if (!pollingIntervalRef.current) {
          startPolling()
        }
      }

      wsRef.current = ws
    } catch (error) {
      console.error("Error connecting WebSocket:", error)
      setError("Failed to connect WebSocket")
      startPolling() // Fallback to polling
    }
  }, [useWebSocket, schoolId])

  // ============================================================================
  // POLLING (FALLBACK)
  // ============================================================================

  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return // Already polling

    console.log("Starting polling fallback")
    setConnectionType("polling")

    // Initial fetch
    fetchLocations()

    // Set up interval
    pollingIntervalRef.current = setInterval(() => {
      fetchLocations()
    }, pollingInterval)
  }, [fetchLocations, pollingInterval])

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }, [])

  // ============================================================================
  // LIFECYCLE
  // ============================================================================

  useEffect(() => {
    if (useWebSocket) {
      connectWebSocket()
    } else {
      startPolling()
    }

    return () => {
      // Cleanup
      if (wsRef.current) {
        wsRef.current.close()
      }
      stopPolling()
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [useWebSocket, connectWebSocket, startPolling, stopPolling])

  // ============================================================================
  // MAP BOUNDS CALCULATION
  // ============================================================================

  const mapBounds = useMemo(() => {
    if (locations.length === 0) return null

    const lats = locations.map((loc) => loc.lat)
    const lons = locations.map((loc) => loc.lon)

    return [
      [Math.min(...lats), Math.min(...lons)] as [number, number],
      [Math.max(...lats), Math.max(...lons)] as [number, number],
    ]
  }, [locations])

  // ============================================================================
  // MANUAL REFRESH
  // ============================================================================

  const handleRefresh = useCallback(() => {
    fetchLocations()
  }, [fetchLocations])

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Card className={phone.card}>
      <CardHeader>
        <div className="flex items-center justify-between max-md:flex-wrap max-md:gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {t.liveTitle ?? "Live student locations"}
            </CardTitle>
            <CardDescription>
              {t.liveDescription ??
                "Students on campus, updated every few seconds"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              <Users className="me-1 h-3 w-3" />
              {locations.length}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground text-sm">
            {lastUpdate && (
              <span>
                {(t.lastUpdate ?? "Updated {time}").replace(
                  "{time}",
                  lastUpdate.toLocaleTimeString(timeLocale)
                )}
              </span>
            )}
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            {isLoading ? (
              <LoaderCircle className="me-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="me-2 h-4 w-4" />
            )}
            {t.refresh ?? "Refresh"}
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="border-destructive/50 bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg border p-3 text-sm">
            <CircleAlert className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Map */}
        <div className="h-[600px] overflow-hidden rounded-lg border">
          <MapContainer
            center={center}
            zoom={zoom}
            style={{ height: "100%", width: "100%" }}
            bounds={mapBounds ?? undefined}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Geofences */}
            {geofences
              .filter(
                (g) =>
                  g.isActive && g.centerLat && g.centerLon && g.radiusMeters
              )
              .map((geofence) => (
                <Circle
                  key={geofence.id}
                  center={[geofence.centerLat!, geofence.centerLon!]}
                  radius={geofence.radiusMeters!}
                  pathOptions={{
                    color: geofence.color || "#3b82f6",
                    fillColor: geofence.color || "#3b82f6",
                    fillOpacity: 0.2,
                  }}
                >
                  <Popup>
                    <div className="text-sm">
                      <p className="font-medium">{geofence.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {geofence.type}
                      </p>
                      <p className="text-xs">
                        {(t.radius ?? "Radius {n} m").replace(
                          "{n}",
                          String(geofence.radiusMeters)
                        )}
                      </p>
                    </div>
                  </Popup>
                </Circle>
              ))}

            {/* Student Markers */}
            {locations.map((location) => (
              <Marker
                key={location.studentId}
                position={[location.lat, location.lon]}
              >
                <Popup>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{location.studentName}</p>
                    <p className="text-muted-foreground text-xs">
                      {location.timestamp.toLocaleTimeString(timeLocale)}
                    </p>
                    {location.accuracy && (
                      <p className="text-xs">
                        {(t.accuracy ?? "Accuracy ±{n} m").replace(
                          "{n}",
                          String(Math.round(location.accuracy))
                        )}
                      </p>
                    )}
                    {location.battery !== null && (
                      <p className="text-xs">
                        {(t.battery ?? "Battery {n}%").replace(
                          "{n}",
                          String(location.battery)
                        )}
                      </p>
                    )}
                    {location.currentGeofences.length > 0 && (
                      <p className="text-xs">
                        {(t.inZones ?? "In {n} zone(s)").replace(
                          "{n}",
                          String(location.currentGeofences.length)
                        )}
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Student List */}
        {locations.length === 0 && (
          <div className="text-muted-foreground py-8 text-center">
            <MapPin className="mx-auto mb-2 h-12 w-12 opacity-20" />
            <p>{t.noStudents ?? "No students on the map right now"}</p>
            <p className="text-sm">
              {t.noStudentsHint ??
                "Students appear here once they turn on location in the app."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
