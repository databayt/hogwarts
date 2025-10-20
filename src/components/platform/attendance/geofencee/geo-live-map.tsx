"use client"

/**
 * GeoLiveMap - Admin/Teacher Live Location Map
 * Real-time student location tracking with Leaflet.js
 * Features: WebSocket updates, polling fallback, geofence visualization
 */

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { MapPin, RefreshCw, Users, Loader2, AlertCircle } from 'lucide-react'
import dynamic from 'next/dynamic'

// Dynamically import Leaflet components (SSR compatibility)
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
)
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
)
const Circle = dynamic(
  () => import('react-leaflet').then((mod) => mod.Circle),
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
  useWebSocket?: boolean // Enable WebSocket (default: true)
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
  useWebSocket = true,
}: GeoLiveMapProps) {
  // State
  const [locations, setLocations] = useState<StudentLocation[]>(initialLocations)
  const [geofences, setGeofences] = useState<Geofence[]>(initialGeofences)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [connectionType, setConnectionType] = useState<'websocket' | 'polling' | null>(null)

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

      const response = await fetch(`/api/geo/live?schoolId=${schoolId}&maxAgeMinutes=5`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      if (data.success && data.data) {
        setLocations(
          data.data.map((loc: any) => ({
            ...loc,
            timestamp: new Date(loc.timestamp),
          }))
        )
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error('Error fetching locations:', error)
      setError('Failed to fetch locations')
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
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = window.location.host
      const wsUrl = `${protocol}//${host}/api/geo/ws`

      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)
        setConnectionType('websocket')
        setError(null)
        reconnectAttemptsRef.current = 0

        // Subscribe to school's geofence channel
        ws.send(
          JSON.stringify({
            type: 'subscribe',
            schoolId,
          })
        )
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)

          if (message.type === 'welcome' || message.type === 'subscribed') {
            console.log('WebSocket:', message)
            toast.success('Connected to live location updates')
          } else if (message.channel?.startsWith('geo_location_')) {
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
                    studentName: 'Student', // Will be populated on next full fetch
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
          } else if (message.channel?.startsWith('geo_event_')) {
            // Geofence event (ENTER/EXIT)
            const eventData = message.data
            toast.info(`${eventData.studentName || 'Student'} ${eventData.eventType.toLowerCase()}ed ${eventData.geofenceName || 'geofence'}`)
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setError('WebSocket connection error')
      }

      ws.onclose = () => {
        console.log('WebSocket closed')
        setIsConnected(false)

        // Attempt reconnection with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
        reconnectAttemptsRef.current++

        reconnectTimeoutRef.current = setTimeout(() => {
          console.log(`Reconnecting WebSocket (attempt ${reconnectAttemptsRef.current})...`)
          connectWebSocket()
        }, delay)

        // Fallback to polling
        if (!pollingIntervalRef.current) {
          startPolling()
        }
      }

      wsRef.current = ws
    } catch (error) {
      console.error('Error connecting WebSocket:', error)
      setError('Failed to connect WebSocket')
      startPolling() // Fallback to polling
    }
  }, [useWebSocket, schoolId])

  // ============================================================================
  // POLLING (FALLBACK)
  // ============================================================================

  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return // Already polling

    console.log('Starting polling fallback')
    setConnectionType('polling')

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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Live Student Locations
            </CardTitle>
            <CardDescription>
              Real-time tracking of students on campus
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? 'default' : 'secondary'}>
              {connectionType === 'websocket' && (
                <>
                  {isConnected ? '🟢' : '🔴'} WebSocket
                </>
              )}
              {connectionType === 'polling' && '🟡 Polling'}
              {!connectionType && 'Connecting...'}
            </Badge>
            <Badge variant="outline">
              <Users className="mr-1 h-3 w-3" />
              {locations.length}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {lastUpdate && (
              <span>Last update: {lastUpdate.toLocaleTimeString()}</span>
            )}
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Map */}
        <div className="h-[600px] rounded-lg overflow-hidden border">
          <MapContainer
            center={center}
            zoom={zoom}
            style={{ height: '100%', width: '100%' }}
            bounds={mapBounds ?? undefined}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Geofences */}
            {geofences
              .filter((g) => g.isActive && g.centerLat && g.centerLon && g.radiusMeters)
              .map((geofence) => (
                <Circle
                  key={geofence.id}
                  center={[geofence.centerLat!, geofence.centerLon!]}
                  radius={geofence.radiusMeters!}
                  pathOptions={{
                    color: geofence.color || '#3b82f6',
                    fillColor: geofence.color || '#3b82f6',
                    fillOpacity: 0.2,
                  }}
                >
                  <Popup>
                    <div className="text-sm">
                      <p className="font-medium">{geofence.name}</p>
                      <p className="text-xs text-muted-foreground">{geofence.type}</p>
                      <p className="text-xs">Radius: {geofence.radiusMeters}m</p>
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
                  <div className="text-sm space-y-1">
                    <p className="font-medium">{location.studentName}</p>
                    <p className="text-xs text-muted-foreground">
                      {location.timestamp.toLocaleTimeString()}
                    </p>
                    {location.accuracy && (
                      <p className="text-xs">Accuracy: ±{Math.round(location.accuracy)}m</p>
                    )}
                    {location.battery !== null && (
                      <p className="text-xs">Battery: {location.battery}%</p>
                    )}
                    {location.currentGeofences.length > 0 && (
                      <p className="text-xs">
                        In {location.currentGeofences.length} geofence(s)
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
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="mx-auto h-12 w-12 mb-2 opacity-20" />
            <p>No students currently tracked</p>
            <p className="text-sm">Student locations will appear when they enable tracking</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
