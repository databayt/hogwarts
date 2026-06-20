// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Trip-plan builder — glue between the optimizer (optimize.ts), bell-time ETAs
// (eta.ts) and the DB. Produces a per-trip snapshot (ordered stops + ETAs +
// polyline) and writes it onto the Trip. Reused by startTrip, the manual
// "regenerate plan" action, the route-default optimizer, and the Phase 3 nightly
// trip builder. Server-only; NOT "use server" (callable from cron routes too).

import "server-only"

import type { Prisma } from "@prisma/client"

import { db } from "@/lib/db"

import { computeStopEtas, getSchoolBellTimes } from "./eta"
import { optimizeRoute, type RouteDir } from "./optimize"

export interface PlanStop {
  stopId: string
  eta: string
  distanceFromPrevKm: number
}

export interface TripPlan {
  optimizedStopOrder: PlanStop[]
  polylineEncoded: string | null
  planSource: string
  totalDistanceKm: number
}

/** ROUND_TRIP anchors on the morning arrival, like a PICKUP run. */
function anchorDirection(direction: string): RouteDir {
  return direction === "DROPOFF" ? "DROPOFF" : "PICKUP"
}

async function getSchoolCoords(
  schoolId: string
): Promise<{ lat: number; lng: number } | null> {
  const school = await db.school
    .findUnique({
      where: { id: schoolId },
      select: { latitude: true, longitude: true },
    })
    .catch(() => null)
  if (!school?.latitude || !school?.longitude) return null
  return { lat: Number(school.latitude), lng: Number(school.longitude) }
}

/**
 * Compute an optimized plan for a route. `stopIds`, when given, restricts the
 * plan to that subset (absence-aware re-routing in Phase 3 — drop empty stops).
 * Returns null when there are no geolocated stops or the school has no coords.
 */
export async function computeTripPlan(args: {
  schoolId: string
  routeId: string
  direction: string
  stopIds?: string[]
}): Promise<TripPlan | null> {
  const { schoolId, routeId, direction, stopIds } = args

  const stops = await db.routeStop.findMany({
    where: {
      schoolId,
      routeId,
      ...(stopIds ? { id: { in: stopIds } } : {}),
    },
    select: { id: true, latitude: true, longitude: true },
    orderBy: { stopOrder: "asc" },
  })

  const geo = stops
    .filter((s) => s.latitude != null && s.longitude != null)
    .map((s) => ({
      id: s.id,
      lat: Number(s.latitude),
      lng: Number(s.longitude),
    }))
  if (geo.length === 0) return null

  const school = await getSchoolCoords(schoolId)
  if (!school) return null

  const dir = anchorDirection(direction)
  const hazardRows = await db.roadHazard
    .findMany({
      where: { schoolId, isActive: true },
      select: { lat: true, lng: true, radiusMeters: true },
    })
    .catch(() => [])
  const hazards = hazardRows.map((h) => ({
    lat: Number(h.lat),
    lng: Number(h.lng),
    radiusMeters: h.radiusMeters,
  }))
  const result = await optimizeRoute({
    stops: geo,
    school,
    direction: dir,
    hazards,
  })
  if (!result) return null

  // Layer clock ETAs on top using the school bell grid + pickup buffer.
  const [bell, settings] = await Promise.all([
    getSchoolBellTimes(schoolId),
    db.transportationSettings
      .findUnique({
        where: { schoolId },
        select: { defaultPickupBufferMinutes: true },
      })
      .catch(() => null),
  ])
  const buffer = settings?.defaultPickupBufferMinutes ?? 10

  let optimizedStopOrder: PlanStop[]
  if (bell) {
    const bellTime = dir === "PICKUP" ? bell.open : bell.close
    optimizedStopOrder = computeStopEtas({
      direction: dir,
      bellTime,
      bufferMinutes: buffer,
      stops: result.orderedStops,
    })
  } else {
    // No bell grid configured — store order/distance without clock times.
    optimizedStopOrder = result.orderedStops.map((s) => ({
      stopId: s.stopId,
      eta: "",
      distanceFromPrevKm: s.distanceFromPrevKm,
    }))
  }

  return {
    optimizedStopOrder,
    polylineEncoded: result.polylineEncoded,
    planSource: result.source,
    totalDistanceKm: result.totalDistanceKm,
  }
}

/** Persist a computed plan onto a trip (tenant-scoped). */
export async function applyTripPlan(
  schoolId: string,
  tripId: string,
  plan: TripPlan
): Promise<void> {
  await db.trip.updateMany({
    where: { id: tripId, schoolId },
    data: {
      optimizedStopOrder:
        plan.optimizedStopOrder as unknown as Prisma.InputJsonValue,
      polylineEncoded: plan.polylineEncoded,
      planGeneratedAt: new Date(),
      planSource: plan.planSource,
    },
  })
}

/**
 * Compute + persist a trip plan in one shot. Best-effort: returns false (never
 * throws) so it can be dropped into startTrip / cron without risking the caller.
 */
export async function generateAndStoreTripPlan(args: {
  schoolId: string
  tripId: string
  routeId: string
  direction: string
  stopIds?: string[]
}): Promise<boolean> {
  try {
    const plan = await computeTripPlan(args)
    if (!plan) return false
    await applyTripPlan(args.schoolId, args.tripId, plan)
    return true
  } catch {
    return false
  }
}
