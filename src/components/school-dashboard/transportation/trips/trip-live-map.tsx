"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Live bus-tracking map. Renders ordered stops + the route polyline and a moving
// bus marker. Primary update path is polling the latest-location endpoint every
// 10s (works without the socket server); when the Socket.IO server is up it also
// receives instant trip:location / trip:approaching pushes. CircleMarkers avoid
// Leaflet's default-icon asset problem.
import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"

import socketService from "@/lib/websocket/socket-service"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Dictionary } from "@/components/internationalization/dictionaries"

// leaflet CSS is loaded globally in src/app/[lang]/layout.tsx

const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
)
const CircleMarker = dynamic(
  () => import("react-leaflet").then((m) => m.CircleMarker),
  { ssr: false }
)
const Polyline = dynamic(
  () => import("react-leaflet").then((m) => m.Polyline),
  { ssr: false }
)
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), {
  ssr: false,
})

interface MapStop {
  id: string
  name: string
  lat: number
  lng: number
}

interface Props {
  tripId: string
  stops: MapStop[]
  routePath?: Array<[number, number]>
  initialLocation?: { lat: number; lng: number } | null
  dictionary: Dictionary
}

export function TripLiveMap({
  tripId,
  stops,
  routePath,
  initialLocation,
  dictionary,
}: Props) {
  const t = dictionary.transportation.tracking
  const [bus, setBus] = useState<{ lat: number; lng: number } | null>(
    initialLocation ?? null
  )
  const [approaching, setApproaching] = useState(false)

  // Poll the latest position (works even when the socket server is down).
  useEffect(() => {
    let active = true
    async function poll() {
      try {
        const res = await fetch(`/api/transportation/location/${tripId}/latest`)
        if (!res.ok) return
        const json = await res.json()
        if (active && json.location) {
          setBus({ lat: json.location.lat, lng: json.location.lng })
        }
      } catch {
        // ignore — next tick retries
      }
    }
    poll()
    const iv = setInterval(poll, 10000)
    return () => {
      active = false
      clearInterval(iv)
    }
  }, [tripId])

  // Optional instant updates when the Socket.IO server is reachable.
  useEffect(() => {
    let offLoc: (() => void) | undefined
    let offApproach: (() => void) | undefined
    try {
      socketService.subscribeToTrip(tripId)
      offLoc = socketService.on("trip:location", (d) => {
        if (d.tripId === tripId) setBus({ lat: d.lat, lng: d.lng })
      })
      offApproach = socketService.on("trip:approaching", (d) => {
        if (d.tripId === tripId) {
          setApproaching(true)
          setTimeout(() => setApproaching(false), 60000)
        }
      })
    } catch {
      // socket not available — polling carries it
    }
    return () => {
      try {
        offLoc?.()
        offApproach?.()
        socketService.unsubscribeFromTrip(tripId)
      } catch {
        // no-op
      }
    }
  }, [tripId])

  const center = useMemo<[number, number] | null>(() => {
    if (bus) return [bus.lat, bus.lng]
    if (stops.length > 0) return [stops[0].lat, stops[0].lng]
    return null
  }, [bus, stops])

  if (!center) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.mapTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">{t.noLocation}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{t.mapTitle}</CardTitle>
        {approaching ? <Badge variant="default">{t.approaching}</Badge> : null}
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-xl border">
          <MapContainer
            center={center}
            zoom={13}
            style={{ height: 360, width: "100%" }}
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {routePath && routePath.length > 1 ? (
              <Polyline positions={routePath} pathOptions={{ weight: 4 }} />
            ) : null}
            {stops.map((s, i) => (
              <CircleMarker
                key={s.id}
                center={[s.lat, s.lng]}
                radius={6}
                pathOptions={{ color: "#2563eb", fillOpacity: 0.9 }}
              >
                <Popup>
                  {i + 1}. {s.name}
                </Popup>
              </CircleMarker>
            ))}
            {bus ? (
              <CircleMarker
                center={[bus.lat, bus.lng]}
                radius={10}
                pathOptions={{
                  color: "#f59e0b",
                  fillColor: "#f59e0b",
                  fillOpacity: 1,
                }}
              >
                <Popup>{t.busLabel}</Popup>
              </CircleMarker>
            ) : null}
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  )
}
