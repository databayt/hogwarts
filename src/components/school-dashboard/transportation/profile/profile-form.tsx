"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Door-to-door pickup-point editor for a single student. Reuses the shared
// MapboxLocationPicker atom (RTL-aware, click-to-pin). Coordinates feed the
// route optimizer (Phase 2).
import { useState, useTransition } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { type LocationResult } from "@/lib/mapbox"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { upsertTransportProfile } from "../actions/profile"
import type { TransportProfileView } from "../actions/profile"
import { resolveTransportationError } from "../error-map"

const MapboxLocationPicker = dynamic(
  () =>
    import("@/components/atom/mapbox-location-picker").then(
      (mod) => mod.MapboxLocationPicker
    ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[320px] w-full rounded-xl" />,
  }
)

interface Point {
  address: string
  lat: number | null
  lng: number | null
}

const toLocationValue = (p: Point): LocationResult | null =>
  p.lat !== null && p.lng !== null
    ? {
        address: p.address,
        city: "",
        state: "",
        country: "",
        postalCode: "",
        latitude: p.lat,
        longitude: p.lng,
      }
    : null

interface Props {
  studentId: string
  initialProfile: TransportProfileView | null
  dictionary: Dictionary
}

export function TransportProfileForm({
  studentId,
  initialProfile,
  dictionary,
}: Props) {
  const t = dictionary.transportation
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [pickup, setPickup] = useState<Point>({
    address: initialProfile?.pickupAddress ?? "",
    lat: initialProfile?.pickupLat ?? null,
    lng: initialProfile?.pickupLng ?? null,
  })
  const [useDropoff, setUseDropoff] = useState(
    initialProfile?.dropoffLat !== null &&
      initialProfile?.dropoffLat !== undefined
  )
  const [dropoff, setDropoff] = useState<Point>({
    address: initialProfile?.dropoffAddress ?? "",
    lat: initialProfile?.dropoffLat ?? null,
    lng: initialProfile?.dropoffLng ?? null,
  })
  const [specialNeeds, setSpecialNeeds] = useState(
    initialProfile?.specialNeeds ?? ""
  )

  function handleSave() {
    startTransition(async () => {
      const result = await upsertTransportProfile({
        studentId,
        pickupAddress: pickup.address || undefined,
        pickupLat: pickup.lat ?? undefined,
        pickupLng: pickup.lng ?? undefined,
        dropoffAddress: useDropoff ? dropoff.address || undefined : undefined,
        dropoffLat: useDropoff ? (dropoff.lat ?? undefined) : undefined,
        dropoffLng: useDropoff ? (dropoff.lng ?? undefined) : undefined,
        specialNeeds: specialNeeds.trim() || undefined,
      })
      if (result.success) {
        toast.success(t.toasts.profileSaved)
        router.refresh()
      } else {
        toast.error(
          resolveTransportationError(
            t,
            "error" in result ? result.error : undefined
          )
        )
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t.profile.title}</CardTitle>
        <p className="text-muted-foreground text-sm">{t.profile.description}</p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label>{t.profile.pickupLocation}</Label>
          <MapboxLocationPicker
            value={toLocationValue(pickup)}
            onChange={(r: LocationResult) =>
              setPickup({
                address: r.address,
                lat: r.latitude,
                lng: r.longitude,
              })
            }
            placeholder={t.profile.searchAddress}
          />
          {pickup.lat !== null && pickup.lng !== null ? (
            <p className="text-muted-foreground text-xs">
              {t.profile.coordinates}: {pickup.lat.toFixed(5)},{" "}
              {pickup.lng.toFixed(5)}
            </p>
          ) : (
            <p className="text-muted-foreground text-xs">
              {t.profile.noLocation}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="useDropoff"
            checked={useDropoff}
            onCheckedChange={setUseDropoff}
          />
          <Label htmlFor="useDropoff">{t.profile.useSeparateDropoff}</Label>
        </div>

        {useDropoff ? (
          <div className="space-y-2">
            <Label>{t.profile.dropoffLocation}</Label>
            <MapboxLocationPicker
              value={toLocationValue(dropoff)}
              onChange={(r: LocationResult) =>
                setDropoff({
                  address: r.address,
                  lat: r.latitude,
                  lng: r.longitude,
                })
              }
              placeholder={t.profile.searchAddress}
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="specialNeeds">{t.profile.specialNeeds}</Label>
          <Textarea
            id="specialNeeds"
            value={specialNeeds}
            onChange={(e) => setSpecialNeeds(e.target.value)}
            placeholder={t.profile.specialNeedsPlaceholder}
            rows={2}
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={pending}>
            {t.profile.save}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
