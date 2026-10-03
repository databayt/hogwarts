// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Where a location-picker map opens, and which area its search favours.
 *
 * Students, staff and applicants almost always live around their school, so
 * the school is the reference point for both the first camera view and the
 * search ranking. Order: the saved pin → the school → the school's country
 * → Khartoum (the product's home market; School.timezone defaults to
 * Africa/Khartoum).
 */

export type LngLat = [number, number]

export interface SchoolGeo {
  latitude: number | null
  longitude: number | null
  /** ISO 3166-1 alpha-2 */
  country: string | null
}

export interface MapBias {
  center: LngLat
  zoom: number
  /** ISO alpha-2 to scope search to, when known */
  country?: string
  /** Search proximity — the school when known, else the view center */
  proximity: LngLat
  /** The school's own point, when known — drawn as a reference marker */
  school?: LngLat
}

const KHARTOUM: LngLat = [32.5599, 15.5007]

/** Rough capital/centroid per country — only used when a school has no pin. */
const COUNTRY_CENTERS: Record<string, { center: LngLat; zoom: number }> = {
  SD: { center: KHARTOUM, zoom: 10 },
  SS: { center: [31.5825, 4.8594], zoom: 10 },
  EG: { center: [31.2357, 30.0444], zoom: 10 },
  SA: { center: [46.6753, 24.7136], zoom: 10 },
  AE: { center: [55.2708, 25.2048], zoom: 10 },
  QA: { center: [51.531, 25.2854], zoom: 10 },
  KW: { center: [47.9774, 29.3759], zoom: 10 },
  BH: { center: [50.586, 26.2285], zoom: 10 },
  OM: { center: [58.4059, 23.588], zoom: 10 },
  JO: { center: [35.9106, 31.9539], zoom: 10 },
  LY: { center: [13.1913, 32.8872], zoom: 10 },
  ET: { center: [38.7578, 8.9806], zoom: 10 },
  ER: { center: [38.9318, 15.3229], zoom: 10 },
  TD: { center: [15.0444, 12.1348], zoom: 10 },
  KE: { center: [36.8219, -1.2921], zoom: 10 },
  RW: { center: [30.0619, -1.9441], zoom: 10 },
  NG: { center: [3.3792, 6.5244], zoom: 10 },
  GB: { center: [-0.1276, 51.5072], zoom: 10 },
  US: { center: [-98.5795, 39.8283], zoom: 4 },
}

/** Null, NaN, out of range and 0,0 (Null Island — an unset pin) are not places. */
export function isValidCoord(
  latitude: number | null | undefined,
  longitude: number | null | undefined
): boolean {
  if (latitude == null || longitude == null) return false
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false
  if (latitude === 0 && longitude === 0) return false
  return Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180
}

export function resolveMapBias(input: {
  value?: { latitude?: number | null; longitude?: number | null } | null
  school?: SchoolGeo | null
}): MapBias & { hasPin: boolean } {
  const { value, school } = input
  const country = school?.country?.toUpperCase() || undefined
  const schoolPoint: LngLat | undefined =
    school && isValidCoord(school.latitude, school.longitude)
      ? [school.longitude as number, school.latitude as number]
      : undefined

  // Fallback view when there is no saved pin
  const area = schoolPoint
    ? { center: schoolPoint, zoom: 12 }
    : (country && COUNTRY_CENTERS[country]) || { center: KHARTOUM, zoom: 10 }

  const base = {
    country,
    proximity: schoolPoint ?? area.center,
    school: schoolPoint,
  }

  if (value && isValidCoord(value.latitude, value.longitude)) {
    return {
      ...base,
      center: [value.longitude as number, value.latitude as number],
      zoom: 16,
      hasPin: true,
    }
  }

  return { ...base, center: area.center, zoom: area.zoom, hasPin: false }
}
