const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""

export interface MapboxFeature {
  id: string
  place_name: string
  center: [number, number] // [lng, lat]
  context?: Array<{
    id: string
    text: string
  }>
  properties?: {
    address?: string
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
  limit = 5
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
      `&types=address,poi,place,locality,neighborhood`

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
  longitude: number
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
      `&types=address,poi,place,locality,neighborhood,region`

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
 * Convert a Mapbox feature to LocationResult
 */
export function featureToLocationResult(
  feature: MapboxFeature
): LocationResult {
  const [longitude, latitude] = feature.center
  const context = feature.context || []

  const findContext = (prefix: string) =>
    context.find((c) => c.id?.startsWith(prefix))?.text || ""

  return {
    address: feature.place_name,
    city: findContext("place") || findContext("locality") || "",
    state: findContext("region"),
    country: findContext("country"),
    postalCode: findContext("postcode"),
    latitude,
    longitude,
  }
}
