// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""

export interface MapboxFeature {
  id: string
  text?: string
  place_name: string
  center: [number, number] // [lng, lat]
  context?: Array<{
    id: string
    text: string
    short_code?: string
  }>
  properties?: {
    address?: string
    short_code?: string
  }
}

export interface MapboxSearchResult {
  features: MapboxFeature[]
}

export interface LocationResult {
  address: string
  city: string
  state: string
  country: string
  postalCode: string
  latitude: number
  longitude: number
}

/**
 * Forward geocoding - search for places by text (global, no country restriction)
 */
export async function searchPlaces(
  query: string,
  limit = 5,
  language?: string
): Promise<MapboxFeature[]> {
  if (!query.trim() || !MAPBOX_ACCESS_TOKEN) {
    return []
  }

  try {
    const encodedQuery = encodeURIComponent(query.trim())
    const url =
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?` +
      `access_token=${MAPBOX_ACCESS_TOKEN}` +
      `&limit=${limit}` +
      `&types=address,poi,place,locality,neighborhood` +
      (language ? `&language=${language}` : "")

    const response = await fetch(url)
    if (!response.ok) {
      return []
    }

    const data: MapboxSearchResult = await response.json()
    return data.features || []
  } catch {
    return []
  }
}

/**
 * Reverse geocoding - get address from coordinates
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
  language?: string
): Promise<LocationResult | null> {
  if (!MAPBOX_ACCESS_TOKEN) {
    return {
      latitude,
      longitude,
      address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      city: "",
      state: "",
      country: "",
      postalCode: "",
    }
  }

  try {
    const url =
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?` +
      `access_token=${MAPBOX_ACCESS_TOKEN}` +
      `&types=address,poi,place,locality,neighborhood,region` +
      (language ? `&language=${language}` : "")

    const response = await fetch(url)
    if (!response.ok) {
      return null
    }

    const data: MapboxSearchResult = await response.json()
    const feature = data.features?.[0]

    if (!feature) {
      return {
        latitude,
        longitude,
        address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        city: "",
        state: "",
        country: "",
        postalCode: "",
      }
    }

    return featureToLocationResult(feature)
  } catch {
    return null
  }
}

/**
 * Convert a Mapbox feature to LocationResult.
 * Country is stored as ISO 2-letter code (e.g., "SD", "US") extracted from
 * the Mapbox context `short_code` property. Falls back to human-readable name.
 */
export function featureToLocationResult(
  feature: MapboxFeature
): LocationResult {
  const [longitude, latitude] = feature.center
  const context = feature.context || []

  const findContext = (prefix: string) =>
    context.find((c) => c.id?.startsWith(prefix))?.text || ""

  const countryContext = context.find((c) => c.id?.startsWith("country"))
  // Mapbox returns short_code as lowercase (e.g., "sd"), uppercase it for ISO
  const countryCode =
    countryContext?.short_code?.toUpperCase() || findContext("country")

  // City-level results (type: "place") don't include a separate "region" context.
  // Fall back to the feature text itself when searching for a city directly.
  const city = findContext("place") || findContext("locality") || ""
  const state =
    findContext("region") ||
    (feature.id?.startsWith("place") ? feature.text : "") ||
    city

  return {
    address: feature.place_name,
    city,
    state,
    country: countryCode,
    postalCode: findContext("postcode"),
    latitude,
    longitude,
  }
}
