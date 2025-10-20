"use client"

/**
 * GeoTracker - Student Location Tracking Component
 * Progressive Web App (PWA) optimized with offline support
 * Features: GPS tracking, IndexedDB offline queue, battery monitoring
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { MapPin, Battery, Wifi, WifiOff, Loader2, AlertCircle } from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface LocationData {
  lat: number
  lon: number
  accuracy?: number
  altitude?: number
  heading?: number
  speed?: number
  battery?: number
  deviceId?: string
  userAgent?: string
  timestamp: number
}

interface GeoTrackerProps {
  updateInterval?: number // Milliseconds between updates (default: 30000 = 30s)
  highAccuracyMode?: boolean // GPS high accuracy mode (default: true)
  onLocationUpdate?: (data: LocationData) => void
}

// ============================================================================
// INDEXEDDB OFFLINE QUEUE
// ============================================================================

class LocationQueue {
  private dbName = 'hogwarts-geofence'
  private storeName = 'location-queue'
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, {
            keyPath: 'id',
            autoIncrement: true,
          })
          store.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  async add(location: LocationData): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.add(location)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getAll(): Promise<LocationData[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async clear(): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async count(): Promise<number> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.count()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function GeoTracker({
  updateInterval = 30000, // 30 seconds default
  highAccuracyMode = true,
  onLocationUpdate,
}: GeoTrackerProps) {
  // State
  const [isTracking, setIsTracking] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null)
  const [isCharging, setIsCharging] = useState(false)
  const [lastLocation, setLastLocation] = useState<LocationData | null>(null)
  const [queueSize, setQueueSize] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [permissionStatus, setPermissionStatus] = useState<PermissionState | null>(null)

  // Refs
  const watchIdRef = useRef<number | null>(null)
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null)
  const queueRef = useRef<LocationQueue>(new LocationQueue())
  const deviceIdRef = useRef<string | null>(null)

  // ============================================================================
  // DEVICE ID (FINGERPRINT)
  // ============================================================================

  useEffect(() => {
    const getDeviceId = () => {
      let deviceId = localStorage.getItem('hogwarts-device-id')
      if (!deviceId) {
        deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        localStorage.setItem('hogwarts-device-id', deviceId)
      }
      return deviceId
    }

    deviceIdRef.current = getDeviceId()
  }, [])

  // ============================================================================
  // BATTERY MONITORING
  // ============================================================================

  useEffect(() => {
    const updateBatteryStatus = (battery: any) => {
      setBatteryLevel(Math.round(battery.level * 100))
      setIsCharging(battery.charging)
    }

    // Battery Status API (experimental, not supported in all browsers)
    if ('getBattery' in navigator) {
      ;(navigator as any).getBattery().then((battery: any) => {
        updateBatteryStatus(battery)

        battery.addEventListener('levelchange', () => updateBatteryStatus(battery))
        battery.addEventListener('chargingchange', () => updateBatteryStatus(battery))
      })
    }
  }, [])

  // ============================================================================
  // ONLINE/OFFLINE DETECTION
  // ============================================================================

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      toast.success('Back online - syncing queued locations...')
      syncOfflineQueue()
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast.warning('Offline - locations will be queued')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // ============================================================================
  // SYNC OFFLINE QUEUE
  // ============================================================================

  const syncOfflineQueue = useCallback(async () => {
    try {
      const queue = queueRef.current
      const locations = await queue.getAll()

      if (locations.length === 0) return

      // Submit locations in batches of 10
      const batchSize = 10
      for (let i = 0; i < locations.length; i += batchSize) {
        const batch = locations.slice(i, i + batchSize)

        for (const location of batch) {
          try {
            await submitLocation(location)
          } catch (error) {
            console.error('Failed to sync location:', error)
            // Keep in queue if submission fails
            return
          }
        }
      }

      // Clear queue after successful sync
      await queue.clear()
      setQueueSize(0)
      toast.success(`Synced ${locations.length} queued locations`)
    } catch (error) {
      console.error('Error syncing offline queue:', error)
    }
  }, [])

  // ============================================================================
  // SUBMIT LOCATION TO API
  // ============================================================================

  const submitLocation = async (location: LocationData) => {
    try {
      const response = await fetch('/api/geo/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lat: location.lat,
          lon: location.lon,
          accuracy: location.accuracy,
          altitude: location.altitude,
          heading: location.heading,
          speed: location.speed,
          battery: location.battery,
          deviceId: location.deviceId,
          userAgent: location.userAgent,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      throw error
    }
  }

  // ============================================================================
  // HANDLE LOCATION UPDATE
  // ============================================================================

  const handleLocationUpdate = useCallback(
    async (position: GeolocationPosition) => {
      const locationData: LocationData = {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude ?? undefined,
        heading: position.coords.heading ?? undefined,
        speed: position.coords.speed ?? undefined,
        battery: batteryLevel ?? undefined,
        deviceId: deviceIdRef.current ?? undefined,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
      }

      setLastLocation(locationData)
      onLocationUpdate?.(locationData)

      try {
        if (isOnline) {
          // Try to submit directly
          await submitLocation(locationData)

          // If successful and there's a queue, sync it
          const count = await queueRef.current.count()
          if (count > 0) {
            syncOfflineQueue()
          }
        } else {
          // Add to offline queue
          await queueRef.current.add(locationData)
          const newCount = await queueRef.current.count()
          setQueueSize(newCount)
        }

        setError(null)
      } catch (error) {
        console.error('Error handling location update:', error)

        // Add to queue on error
        await queueRef.current.add(locationData)
        const newCount = await queueRef.current.count()
        setQueueSize(newCount)

        setError('Failed to submit location - added to queue')
      }
    },
    [isOnline, batteryLevel, onLocationUpdate, syncOfflineQueue]
  )

  // ============================================================================
  // START TRACKING
  // ============================================================================

  const startTracking = useCallback(async () => {
    try {
      // Check permission
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName })
        setPermissionStatus(permission.state)

        if (permission.state === 'denied') {
          setError('Location permission denied. Please enable location access in your browser settings.')
          return
        }
      }

      // Request location
      if (!('geolocation' in navigator)) {
        setError('Geolocation is not supported by your browser')
        return
      }

      // Start watching position
      const watchId = navigator.geolocation.watchPosition(
        handleLocationUpdate,
        (error) => {
          console.error('Geolocation error:', error)
          setError(`Location error: ${error.message}`)

          if (error.code === error.PERMISSION_DENIED) {
            setPermissionStatus('denied')
          }
        },
        {
          enableHighAccuracy: highAccuracyMode,
          maximumAge: 10000, // Accept cached position up to 10s old
          timeout: 30000, // 30s timeout
        }
      )

      watchIdRef.current = watchId
      setIsTracking(true)
      setError(null)
      toast.success('Location tracking started')

      // Initialize offline queue
      await queueRef.current.init()
      const count = await queueRef.current.count()
      setQueueSize(count)

    } catch (error) {
      console.error('Error starting tracking:', error)
      setError('Failed to start tracking')
    }
  }, [handleLocationUpdate, highAccuracyMode])

  // ============================================================================
  // STOP TRACKING
  // ============================================================================

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }

    if (intervalIdRef.current !== null) {
      clearInterval(intervalIdRef.current)
      intervalIdRef.current = null
    }

    setIsTracking(false)
    toast.info('Location tracking stopped')
  }, [])

  // ============================================================================
  // CLEANUP
  // ============================================================================

  useEffect(() => {
    return () => {
      stopTracking()
    }
  }, [stopTracking])

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Location Tracking
        </CardTitle>
        <CardDescription>
          Your location is tracked to automatically mark attendance when you enter school grounds
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant={isTracking ? 'default' : 'secondary'}>
            {isTracking ? (
              <>
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                Tracking Active
              </>
            ) : (
              'Tracking Stopped'
            )}
          </Badge>

          <Badge variant={isOnline ? 'default' : 'destructive'}>
            {isOnline ? (
              <>
                <Wifi className="mr-1 h-3 w-3" />
                Online
              </>
            ) : (
              <>
                <WifiOff className="mr-1 h-3 w-3" />
                Offline
              </>
            )}
          </Badge>

          {batteryLevel !== null && (
            <Badge variant={batteryLevel < 20 ? 'destructive' : 'secondary'}>
              <Battery className="mr-1 h-3 w-3" />
              {batteryLevel}% {isCharging && '⚡'}
            </Badge>
          )}

          {queueSize > 0 && (
            <Badge variant="outline">
              {queueSize} queued
            </Badge>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Last Location */}
        {lastLocation && (
          <div className="space-y-2 rounded-lg border p-3 text-sm">
            <p className="font-medium">Last Location:</p>
            <div className="grid grid-cols-2 gap-2 text-muted-foreground">
              <div>Latitude: {lastLocation.lat.toFixed(6)}</div>
              <div>Longitude: {lastLocation.lon.toFixed(6)}</div>
              {lastLocation.accuracy && (
                <div>Accuracy: ±{Math.round(lastLocation.accuracy)}m</div>
              )}
              <div>
                Updated: {new Date(lastLocation.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2">
          {!isTracking ? (
            <Button onClick={startTracking} className="flex-1">
              Start Tracking
            </Button>
          ) : (
            <Button onClick={stopTracking} variant="destructive" className="flex-1">
              Stop Tracking
            </Button>
          )}

          {queueSize > 0 && (
            <Button onClick={syncOfflineQueue} variant="outline" disabled={!isOnline}>
              Sync Queue ({queueSize})
            </Button>
          )}
        </div>

        {/* Permission Warning */}
        {permissionStatus === 'denied' && (
          <p className="text-xs text-muted-foreground">
            Location permission is required. Please enable it in your browser settings and reload the page.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
