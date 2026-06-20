"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Admin road-hazard management, mounted on the transportation settings page.
// Pin a hazard via the map; the optimizer routes around active hazards and
// affected guardians are alerted.
import { useState, useTransition } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { type LocationResult } from "@/lib/mapbox"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import {
  createRoadHazard,
  deleteRoadHazard,
  type RoadHazardView,
} from "../actions/hazards"

const MapboxLocationPicker = dynamic(
  () =>
    import("@/components/atom/mapbox-location-picker").then(
      (mod) => mod.MapboxLocationPicker
    ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[240px] w-full rounded-xl" />,
  }
)

const HAZARD_TYPES = [
  "road_closure",
  "accident",
  "flooding",
  "construction",
  "other",
] as const

interface Props {
  hazards: RoadHazardView[]
  dictionary: Dictionary
}

export function HazardsSection({ hazards, dictionary }: Props) {
  const t = dictionary.transportation.hazards
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState("")
  const [type, setType] = useState<(typeof HAZARD_TYPES)[number]>("other")
  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null)
  const [radius, setRadius] = useState(200)

  function add() {
    if (!name.trim() || !loc) return
    startTransition(async () => {
      const res = await createRoadHazard({
        name: name.trim(),
        type,
        lat: loc.lat,
        lng: loc.lng,
        radiusMeters: radius,
      })
      if (res.success) {
        toast.success(t.created)
        setName("")
        setLoc(null)
        setRadius(200)
        setType("other")
        router.refresh()
      } else {
        toast.error(t.failed)
      }
    })
  }

  function remove(id: string) {
    startTransition(async () => {
      const res = await deleteRoadHazard(id)
      if (res.success) {
        toast.success(t.removed)
        router.refresh()
      } else {
        toast.error(t.failed)
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t.title}</CardTitle>
        <p className="text-muted-foreground text-sm">{t.description}</p>
      </CardHeader>
      <CardContent className="space-y-5">
        {hazards.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {hazards.map((h) => (
              <li
                key={h.id}
                className="flex items-center justify-between border-b py-1.5 last:border-b-0"
              >
                <span>
                  <span className="font-medium">{h.name}</span>
                  <span className="text-muted-foreground ms-2 text-xs">
                    {t.types[h.type as keyof typeof t.types] ?? h.type} ·{" "}
                    {h.radiusMeters} m
                  </span>
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  type="button"
                  onClick={() => remove(h.id)}
                  disabled={pending}
                >
                  {t.remove}
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">{t.none}</p>
        )}

        <div className="space-y-3 border-t pt-4">
          <div className="grid gap-1.5">
            <Label htmlFor="hazardName">{t.name}</Label>
            <Input
              id="hazardName"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>{t.type}</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as (typeof HAZARD_TYPES)[number])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HAZARD_TYPES.map((ht) => (
                  <SelectItem key={ht} value={ht}>
                    {t.types[ht]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>{t.location}</Label>
            <MapboxLocationPicker
              value={null}
              onChange={(r: LocationResult) =>
                setLoc({ lat: r.latitude, lng: r.longitude })
              }
              placeholder={t.searchAddress}
              mapHeight={220}
            />
            {loc ? (
              <p className="text-muted-foreground text-xs">
                {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}
              </p>
            ) : null}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="hazardRadius">{t.radius}</Label>
            <Input
              id="hazardRadius"
              type="number"
              min={10}
              max={20000}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value) || 0)}
            />
          </div>
          <Button onClick={add} disabled={pending || !name.trim() || !loc}>
            {t.save}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
