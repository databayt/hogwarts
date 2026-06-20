// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Route optimization engine (Phase 2). Orders a route's stops to minimize travel
// time between each pickup/drop point and the school, and returns per-stop
// cumulative travel seconds (consumed by eta.ts to assign clock ETAs) plus an
// encoded polyline for the live map.
//
// Three tiers, best-first, with graceful degradation — NEVER throws to callers:
//   1. Mapbox Optimization API v1 (≤11 stops + school = 12 coords) — solves the
//      ordering AND returns traffic-aware leg durations + geometry in one call.
//   2. Mapbox Matrix API (≤24 stops) — traffic-aware duration matrix → our
//      nearest-neighbor + 2-opt heuristic → Directions API for the polyline.
//   3. Haversine nearest-neighbor + 2-opt (any size / no token / API failure) —
//      geometric ordering with an assumed average speed. No live traffic.
//
// Server token: prefers MAPBOX_SERVER_TOKEN (secret, never NEXT_PUBLIC_); falls
// back to the public token for local dev, then to the Haversine tier.

import "server-only"

import { haversineKm } from "@/lib/haversine"

export type RouteDir = "PICKUP" | "DROPOFF"
export type OptimizeSource =
  | "mapbox_optimization"
  | "mapbox_matrix"
  | "haversine"

export interface OptimizeStop {
  id: string
  lat: number
  lng: number
}

export interface HazardZone {
  lat: number
  lng: number
  radiusMeters: number
}

const HAZARD_PENALTY_KM = 50 // ordering penalty for legs passing near a hazard

/** Approx: a leg "passes near" a hazard if an endpoint or the midpoint is in range. */
function segmentNearHazard(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
  hazards: HazardZone[]
): boolean {
  const mid = { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 }
  for (const h of hazards) {
    const r = h.radiusMeters
    if (
      haversineKm(a.lat, a.lng, h.lat, h.lng) * 1000 <= r ||
      haversineKm(b.lat, b.lng, h.lat, h.lng) * 1000 <= r ||
      haversineKm(mid.lat, mid.lng, h.lat, h.lng) * 1000 <= r
    ) {
      return true
    }
  }
  return false
}

export interface OptimizedStop {
  stopId: string
  /** Travel seconds between this stop and the school along the route path. */
  cumulativeSecondsFromSchool: number
  distanceFromPrevKm: number
}

export interface OptimizeResult {
  /** Stops in the order the bus visits them (school excluded). */
  orderedStops: OptimizedStop[]
  totalDistanceKm: number
  totalSeconds: number
  polylineEncoded: string | null
  source: OptimizeSource
}

const ASSUMED_SPEED_KMH = 30 // city average for the Haversine fallback
const MAPBOX_BASE = "https://api.mapbox.com"

const round2 = (n: number) => Math.round(n * 100) / 100

function serverToken(): string | undefined {
  return process.env.MAPBOX_SERVER_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN
}

// ===========================================================================
// Public entry point
// ===========================================================================

export async function optimizeRoute(args: {
  stops: OptimizeStop[]
  school: { lat: number; lng: number }
  direction: RouteDir
  hazards?: HazardZone[]
}): Promise<OptimizeResult | null> {
  const { stops, school, direction, hazards } = args
  if (stops.length === 0) return null

  // Mapbox tiers rely on live traffic for avoidance (point-exclusion isn't
  // supported); the Haversine tier applies the manual hazard penalty.
  const token = serverToken()
  if (token) {
    if (stops.length <= 11) {
      const r = await tryMapboxOptimization(
        stops,
        school,
        direction,
        token
      ).catch(() => null)
      if (r) return r
    }
    if (stops.length <= 24) {
      const r = await tryMapboxMatrix(stops, school, direction, token).catch(
        () => null
      )
      if (r) return r
    }
  }
  return haversineOptimize(stops, school, direction, hazards)
}

// ===========================================================================
// Shared heuristic — nearest-neighbor + 2-opt over a symmetric cost matrix
// ===========================================================================

/**
 * Order stop indices [0..n-1] as an open path beginning nearest to `fromIndex`
 * (the school). `cost[a][b]` is the travel cost between coordinate indices.
 */
function nearestNeighborOrder(
  cost: number[][],
  stopIndices: number[],
  fromIndex: number
): number[] {
  const remaining = new Set(stopIndices)
  const order: number[] = []
  let current = fromIndex
  while (remaining.size > 0) {
    let best = -1
    let bestCost = Infinity
    for (const idx of remaining) {
      const c = cost[current][idx]
      if (c < bestCost) {
        bestCost = c
        best = idx
      }
    }
    order.push(best)
    remaining.delete(best)
    current = best
  }
  return order
}

/** 2-opt improvement of an open path anchored at `fromIndex` (the school). */
function twoOpt(
  cost: number[][],
  order: number[],
  fromIndex: number
): number[] {
  const pathCost = (seq: number[]): number => {
    let total = cost[fromIndex][seq[0]]
    for (let i = 1; i < seq.length; i++) total += cost[seq[i - 1]][seq[i]]
    return total
  }
  let best = order.slice()
  let bestCost = pathCost(best)
  let improved = true
  let guard = 0
  while (improved && guard < 50) {
    improved = false
    guard++
    for (let i = 0; i < best.length - 1; i++) {
      for (let k = i + 1; k < best.length; k++) {
        const candidate = best
          .slice(0, i)
          .concat(best.slice(i, k + 1).reverse(), best.slice(k + 1))
        const c = pathCost(candidate)
        if (c < bestCost - 1e-9) {
          best = candidate
          bestCost = c
          improved = true
        }
      }
    }
  }
  return best
}

/**
 * Build the directional result from a geometric (nearest-first-from-school)
 * stop order and cost accessors. `secAt`/`kmAt` look up travel seconds/km
 * between two coordinate indices; `schoolIndex` is the school's coordinate index.
 */
function assemble(args: {
  stops: OptimizeStop[]
  order: number[] // stop indices, nearest-first from school
  schoolIndex: number
  direction: RouteDir
  secAt: (a: number, b: number) => number
  kmAt: (a: number, b: number) => number
  polylineEncoded: string | null
  source: OptimizeSource
}): OptimizeResult {
  const { stops, order, schoolIndex, direction, secAt, kmAt } = args
  const orderedStops: OptimizedStop[] = []
  let totalSeconds = 0
  let totalKm = 0

  if (direction === "DROPOFF") {
    // school → order[0] → order[1] → …
    let prev = schoolIndex
    let cum = 0
    for (const idx of order) {
      const sec = secAt(prev, idx)
      const km = kmAt(prev, idx)
      cum += sec
      totalSeconds += sec
      totalKm += km
      orderedStops.push({
        stopId: stops[idx].id,
        cumulativeSecondsFromSchool: cum,
        distanceFromPrevKm: round2(km),
      })
      prev = idx
    }
  } else {
    // PICKUP: pick up farthest first, arrive school last.
    const rev = [...order].reverse()
    const legSec: number[] = []
    const legKm: number[] = []
    for (let i = 0; i < rev.length; i++) {
      const next = i < rev.length - 1 ? rev[i + 1] : schoolIndex
      legSec.push(secAt(rev[i], next))
      legKm.push(kmAt(rev[i], next))
    }
    totalSeconds = legSec.reduce((a, b) => a + b, 0)
    totalKm = legKm.reduce((a, b) => a + b, 0)
    // cumulativeFromSchool(rev[i]) = sum of leg seconds from rev[i] to school.
    let suffix = 0
    const cum: number[] = new Array(rev.length)
    for (let i = rev.length - 1; i >= 0; i--) {
      suffix += legSec[i]
      cum[i] = suffix
    }
    for (let i = 0; i < rev.length; i++) {
      orderedStops.push({
        stopId: stops[rev[i]].id,
        cumulativeSecondsFromSchool: cum[i],
        distanceFromPrevKm: round2(i === 0 ? 0 : legKm[i - 1]),
      })
    }
  }

  return {
    orderedStops,
    totalDistanceKm: round2(totalKm),
    totalSeconds: Math.round(totalSeconds),
    polylineEncoded: args.polylineEncoded,
    source: args.source,
  }
}

// ===========================================================================
// Tier 3 — Haversine fallback
// ===========================================================================

export function haversineOptimize(
  stops: OptimizeStop[],
  school: { lat: number; lng: number },
  direction: RouteDir,
  hazards?: HazardZone[]
): OptimizeResult {
  const coords = [...stops, school]
  const schoolIndex = stops.length
  const kmAt = (a: number, b: number) =>
    haversineKm(coords[a].lat, coords[a].lng, coords[b].lat, coords[b].lng)
  const secAt = (a: number, b: number) =>
    (kmAt(a, b) / ASSUMED_SPEED_KMH) * 3600

  // Symmetric cost matrix for the heuristic. Hazard penalty biases ORDERING only
  // (kmAt/secAt stay real, so reported distance/ETA aren't inflated).
  const active = hazards && hazards.length > 0 ? hazards : null
  const n = coords.length
  const cost: number[][] = Array.from({ length: n }, () => new Array(n).fill(0))
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      let km = haversineKm(
        coords[i].lat,
        coords[i].lng,
        coords[j].lat,
        coords[j].lng
      )
      if (active && segmentNearHazard(coords[i], coords[j], active)) {
        km += HAZARD_PENALTY_KM
      }
      cost[i][j] = km
      cost[j][i] = km
    }
  }

  const stopIndices = stops.map((_, i) => i)
  let order = nearestNeighborOrder(cost, stopIndices, schoolIndex)
  order = twoOpt(cost, order, schoolIndex)

  return assemble({
    stops,
    order,
    schoolIndex,
    direction,
    secAt,
    kmAt,
    polylineEncoded: null,
    source: "haversine",
  })
}

// ===========================================================================
// Tier 2 — Mapbox Matrix API + heuristic + Directions polyline
// ===========================================================================

async function tryMapboxMatrix(
  stops: OptimizeStop[],
  school: { lat: number; lng: number },
  direction: RouteDir,
  token: string
): Promise<OptimizeResult | null> {
  const coords = [...stops, school]
  const schoolIndex = stops.length
  const coordStr = coords.map((c) => `${c.lng},${c.lat}`).join(";")
  const url =
    `${MAPBOX_BASE}/directions-matrix/v1/mapbox/driving-traffic/${coordStr}` +
    `?annotations=duration,distance&access_token=${token}`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = (await res.json()) as {
    durations?: number[][]
    distances?: number[][]
  }
  const durations = data.durations
  if (!durations) return null
  const distances = data.distances

  const secAt = (a: number, b: number) => durations[a]?.[b] ?? 0
  const kmAt = (a: number, b: number) =>
    distances?.[a]?.[b] != null
      ? distances[a][b] / 1000
      : haversineKm(coords[a].lat, coords[a].lng, coords[b].lat, coords[b].lng)

  const stopIndices = stops.map((_, i) => i)
  let order = nearestNeighborOrder(durations, stopIndices, schoolIndex)
  order = twoOpt(durations, order, schoolIndex)

  // Build the visit sequence (incl. school) to request a drawable polyline.
  const visitCoords =
    direction === "DROPOFF"
      ? [coords[schoolIndex], ...order.map((i) => coords[i])]
      : [...[...order].reverse().map((i) => coords[i]), coords[schoolIndex]]
  const polyline = await fetchDirectionsPolyline(visitCoords, token).catch(
    () => null
  )

  return assemble({
    stops,
    order,
    schoolIndex,
    direction,
    secAt,
    kmAt,
    polylineEncoded: polyline,
    source: "mapbox_matrix",
  })
}

async function fetchDirectionsPolyline(
  coords: Array<{ lat: number; lng: number }>,
  token: string
): Promise<string | null> {
  const coordStr = coords.map((c) => `${c.lng},${c.lat}`).join(";")
  const url =
    `${MAPBOX_BASE}/directions/v5/mapbox/driving-traffic/${coordStr}` +
    `?geometries=polyline&overview=full&access_token=${token}`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = (await res.json()) as {
    routes?: Array<{ geometry?: string }>
  }
  return data.routes?.[0]?.geometry ?? null
}

// ===========================================================================
// Tier 1 — Mapbox Optimization API v1
// ===========================================================================

async function tryMapboxOptimization(
  stops: OptimizeStop[],
  school: { lat: number; lng: number },
  direction: RouteDir,
  token: string
): Promise<OptimizeResult | null> {
  // DROPOFF: school is the fixed start (source=first). PICKUP: school is the
  // fixed end (destination=last). roundtrip=false → open path.
  const coordsForApi =
    direction === "DROPOFF" ? [school, ...stops] : [...stops, school]
  const coordStr = coordsForApi.map((c) => `${c.lng},${c.lat}`).join(";")
  const params =
    direction === "DROPOFF"
      ? "source=first&destination=any"
      : "source=any&destination=last"
  const url =
    `${MAPBOX_BASE}/optimized-trips/v1/mapbox/driving-traffic/${coordStr}` +
    `?roundtrip=false&${params}&geometries=polyline&overview=full&annotations=duration,distance&access_token=${token}`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = (await res.json()) as {
    code?: string
    trips?: Array<{
      geometry?: string
      legs?: Array<{ duration?: number; distance?: number }>
    }>
    waypoints?: Array<{ waypoint_index: number }>
  }
  if (data.code !== "Ok" || !data.trips?.[0] || !data.waypoints) return null

  const trip = data.trips[0]
  const legs = trip.legs ?? []
  // waypoints[] are in INPUT order; waypoint_index gives each one's position in
  // the optimized visit sequence. Invert to get the visit sequence as input idx.
  const visitSeqInputIdx: number[] = new Array(data.waypoints.length)
  data.waypoints.forEach((w, inputIdx) => {
    visitSeqInputIdx[w.waypoint_index] = inputIdx
  })

  // Map input index → stop (school is the extra coordinate). Determine where the
  // school sits in the input array per direction.
  const schoolInputIdx = direction === "DROPOFF" ? 0 : stops.length
  const inputIdxToStop = (inputIdx: number): OptimizeStop | null => {
    if (inputIdx === schoolInputIdx) return null
    // For DROPOFF, stops start at input index 1; for PICKUP at index 0.
    const stopArrayIdx = direction === "DROPOFF" ? inputIdx - 1 : inputIdx
    return stops[stopArrayIdx] ?? null
  }

  // Walk the optimized visit sequence accumulating leg durations/distances.
  const orderedStops: OptimizedStop[] = []
  let totalSeconds = 0
  let totalKm = 0

  if (direction === "DROPOFF") {
    // visit seq: school, s, s, … ; legs[i] connects visit i → i+1
    let cum = 0
    for (let i = 1; i < visitSeqInputIdx.length; i++) {
      const leg = legs[i - 1]
      const sec = leg?.duration ?? 0
      const km = (leg?.distance ?? 0) / 1000
      cum += sec
      totalSeconds += sec
      totalKm += km
      const stop = inputIdxToStop(visitSeqInputIdx[i])
      if (stop)
        orderedStops.push({
          stopId: stop.id,
          cumulativeSecondsFromSchool: cum,
          distanceFromPrevKm: round2(km),
        })
    }
  } else {
    // visit seq: s, s, …, school ; cumulativeFromSchool = suffix sum to school.
    const m = visitSeqInputIdx.length
    const legSec: number[] = []
    const legKm: number[] = []
    for (let i = 0; i < m - 1; i++) {
      legSec.push(legs[i]?.duration ?? 0)
      legKm.push((legs[i]?.distance ?? 0) / 1000)
    }
    totalSeconds = legSec.reduce((a, b) => a + b, 0)
    totalKm = legKm.reduce((a, b) => a + b, 0)
    let suffix = 0
    const cum: number[] = new Array(m - 1)
    for (let i = m - 2; i >= 0; i--) {
      suffix += legSec[i]
      cum[i] = suffix
    }
    for (let i = 0; i < m - 1; i++) {
      const stop = inputIdxToStop(visitSeqInputIdx[i])
      if (stop)
        orderedStops.push({
          stopId: stop.id,
          cumulativeSecondsFromSchool: cum[i],
          distanceFromPrevKm: round2(i === 0 ? 0 : legKm[i - 1]),
        })
    }
  }

  if (orderedStops.length === 0) return null
  return {
    orderedStops,
    totalDistanceKm: round2(totalKm),
    totalSeconds: Math.round(totalSeconds),
    polylineEncoded: trip.geometry ?? null,
    source: "mapbox_optimization",
  }
}
