"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Driver-facing live GPS streamer. Watches the device position and posts to the
// transport location ingest endpoint (~every 5s) while the trip is in progress.
// Mounted on the trip detail page for the trip's driver / boarding-recorders.
import { useEffect, useRef, useState } from "react"
import { Navigation } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Dictionary } from "@/components/internationalization/dictionaries"

const MIN_SEND_INTERVAL_MS = 4500

interface Props {
  tripId: string
  dictionary: Dictionary
}

export function DriverTracker({ tripId, dictionary }: Props) {
  const t = dictionary.transportation.tracking
  const [tracking, setTracking] = useState(false)
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle")
  const [speedKmh, setSpeedKmh] = useState<number | null>(null)
  const watchId = useRef<number | null>(null)
  const lastSent = useRef(0)

  useEffect(() => {
    return () => {
      if (watchId.current !== null && "geolocation" in navigator) {
        navigator.geolocation.clearWatch(watchId.current)
      }
    }
  }, [])

  async function send(pos: GeolocationPosition) {
    const now = Date.now()
    if (now - lastSent.current < MIN_SEND_INTERVAL_MS) return
    lastSent.current = now
    const { latitude, longitude, accuracy, heading, speed } = pos.coords
    try {
      const res = await fetch("/api/transportation/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId,
          lat: latitude,
          lng: longitude,
          accuracy: accuracy ?? undefined,
          heading:
            heading != null && !Number.isNaN(heading) ? heading : undefined,
          speed:
            speed != null && !Number.isNaN(speed) && speed >= 0
              ? speed
              : undefined,
        }),
      })
      setStatus(res.ok ? "ok" : "error")
      setSpeedKmh(
        speed != null && !Number.isNaN(speed) && speed >= 0
          ? Math.round(speed * 3.6)
          : null
      )
    } catch {
      setStatus("error")
    }
  }

  function start() {
    if (!("geolocation" in navigator)) {
      setStatus("error")
      return
    }
    setTracking(true)
    setStatus("ok")
    watchId.current = navigator.geolocation.watchPosition(
      send,
      () => setStatus("error"),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    )
  }

  function stop() {
    setTracking(false)
    setStatus("idle")
    if (watchId.current !== null && "geolocation" in navigator) {
      navigator.geolocation.clearWatch(watchId.current)
      watchId.current = null
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Navigation className="size-4" />
          {t.title}
        </CardTitle>
        <Badge
          variant={
            status === "ok"
              ? "default"
              : status === "error"
                ? "destructive"
                : "outline"
          }
        >
          {status === "ok"
            ? t.statusOk
            : status === "error"
              ? t.statusError
              : t.statusIdle}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-muted-foreground text-sm">{t.description}</p>
        {tracking && speedKmh !== null ? (
          <p className="text-sm">
            {t.speed}: <span className="font-medium">{speedKmh} km/h</span>
          </p>
        ) : null}
        {tracking ? (
          <Button variant="outline" onClick={stop}>
            {t.stop}
          </Button>
        ) : (
          <Button onClick={start}>{t.start}</Button>
        )}
      </CardContent>
    </Card>
  )
}
