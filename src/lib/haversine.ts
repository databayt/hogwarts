// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Pure great-circle distance helpers. No external dependencies — used by the
// transportation route optimizer's Haversine fallback tier and for computing
// Route.distanceKm when all stops have coordinates.
//
// NOTE: callers must pass plain numbers. Prisma `Decimal` does NOT auto-coerce —
// call `.toNumber()` on Decimal columns before passing them here.

const EARTH_RADIUS_KM = 6371

const toRad = (deg: number): number => (deg * Math.PI) / 180

export interface LatLng {
  lat: number
  lng: number
}

/**
 * Great-circle distance between two points in kilometres.
 */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Great-circle distance between two LatLng points in metres — used for
 * proximity checks (e.g. "bus within N metres of a stop").
 */
export function haversineMeters(a: LatLng, b: LatLng): number {
  return haversineKm(a.lat, a.lng, b.lat, b.lng) * 1000
}

/**
 * Total path length (sum of consecutive legs) for an ordered list of points,
 * in kilometres. Returns 0 for fewer than two points.
 */
export function routeDistanceKm(points: LatLng[]): number {
  let total = 0
  for (let i = 1; i < points.length; i++) {
    total += haversineKm(
      points[i - 1].lat,
      points[i - 1].lng,
      points[i].lat,
      points[i].lng
    )
  }
  return total
}
