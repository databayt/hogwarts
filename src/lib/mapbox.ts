// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Mapbox Geocoding v6 client for the location picker.
 *
 * WHY v6 + a school bias, not the Search Box API: measured 2026-10-03 against
 * Khartoum queries ("الرياض", "بري", "كافوري", "الطائف"), v6 and Search Box return
 * IDENTICAL results once both get `country` + `proximity`. Without the bias
 * either API answers "الرياض" with Saudi Arabia, Egypt, Spain… and never the
 * Khartoum neighbourhood. So the win is the bias; v6 adds coordinates inline
 * (no /retrieve round trip before the map can fly) and bills per request on
 * the existing free tier.
 *
 * Sudan has thin street data but rich neighbourhood/block data ("كافوري مربع 9"),
 * so suggestions go down to neighbourhood and the pin + a free-text details
 * line carry the last metres.
 */

const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""
const GEOCODE_V6 = "https://api.mapbox.com/search/geocode/v6"

const FORWARD_TYPES =
  "address,street,neighborhood,locality,place,district,postcode"
const REVERSE_TYPES = "address,street,neighborhood,locality,place"

export type PlaceType =
  | "address"
  | "street"
  | "neighborhood"
  | "locality"
  | "place"
  | "district"
  | "postcode"
  | "region"
  | "country"

interface ContextPart {
  name?: string
  country_code?: string
}

interface V6Feature {
  id: string
  geometry: { coordinates: [number, number] }
  properties: {
    mapbox_id: string
    feature_type: PlaceType
    name?: string
    name_preferred?: string
    place_formatted?: string
    full_address?: string
    coordinates: { longitude: number; latitude: number }
    context?: Partial<
      Record<
        | "address"
        | "street"
        | "neighborhood"
        | "locality"
        | "place"
        | "district"
        | "postcode"
        | "region"
        | "country",
        ContextPart
      >
    >
  }
}

/** One autocomplete row — carries its own coordinates, so selecting it can fly at once. */
export interface PlaceSuggestion {
  id: string
  type: PlaceType
  /** The place itself: "كافوري مربع 9", "10 Downing Street" */
  name: string
  /** Its surroundings, empty segments removed: "ولاية الخرطوم، السودان" */
  context: string
  location: LocationResult
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

export interface SearchBias {
  /** ISO 3166-1 alpha-2, any case */
  country?: string
  /** [longitude, latitude] — results near it rank first */
  proximity?: [number, number]
}

/** Arabic comma for Arabic text, Latin comma otherwise. */
function joiner(language?: string): string {
  return language === "ar" ? "، " : ", "
}

/** Join name parts, dropping blanks and repeats (Sudan's data has both). */
function joinParts(parts: Array<string | undefined>, language?: string) {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of parts) {
    const part = raw?.trim()
    if (!part || seen.has(part)) continue
    seen.add(part)
    out.push(part)
  }
  return out.join(joiner(language))
}

/** Map a v6 feature to the stored address shape (unchanged for every consumer). */
export function featureToLocationResult(
  feature: V6Feature,
  language?: string
): LocationResult {
  const p = feature.properties
  const ctx = p.context ?? {}
  const name = p.name_preferred || p.name || ""

  const city =
    ctx.place?.name ||
    ctx.locality?.name ||
    ctx.district?.name ||
    (p.feature_type === "place" ? name : "")
  const state = ctx.region?.name || city
  const country = (ctx.country?.country_code || "").toUpperCase()

  // The precise part first (street address or neighbourhood), then the area.
  // full_address is not used: in Sudan it carries empty segments ("x، ، y").
  const address = joinParts(
    [
      name,
      ctx.neighborhood?.name,
      ctx.locality?.name,
      ctx.place?.name,
      ctx.region?.name,
      ctx.country?.name,
    ],
    language
  )

  return {
    address,
    city: city || name,
    state: state || name,
    country,
    postalCode: ctx.postcode?.name || "",
    latitude: p.coordinates.latitude,
    longitude: p.coordinates.longitude,
  }
}

function toSuggestion(feature: V6Feature, language?: string): PlaceSuggestion {
  const p = feature.properties
  const ctx = p.context ?? {}
  const name = p.name_preferred || p.name || ""
  return {
    id: p.mapbox_id || feature.id,
    type: p.feature_type,
    name,
    context: joinParts(
      [
        ctx.neighborhood?.name,
        ctx.locality?.name,
        ctx.place?.name,
        ctx.region?.name,
        ctx.country?.name,
      ].filter((part) => part !== name),
      language
    ),
    location: featureToLocationResult(feature, language),
  }
}

// Small LRU so backspacing and retyping never re-hits the API.
const CACHE_LIMIT = 50
const cache = new Map<string, PlaceSuggestion[]>()

function cacheGet(key: string): PlaceSuggestion[] | undefined {
  const hit = cache.get(key)
  if (hit) {
    cache.delete(key)
    cache.set(key, hit)
  }
  return hit
}

function cacheSet(key: string, value: PlaceSuggestion[]): void {
  cache.set(key, value)
  if (cache.size > CACHE_LIMIT) {
    const oldest = cache.keys().next().value
    if (oldest !== undefined) cache.delete(oldest)
  }
}

async function forward(
  query: string,
  language: string | undefined,
  bias: SearchBias,
  limit: number,
  signal?: AbortSignal
): Promise<V6Feature[]> {
  const params = new URLSearchParams({
    q: query,
    autocomplete: "true",
    types: FORWARD_TYPES,
    limit: String(limit),
    access_token: MAPBOX_ACCESS_TOKEN,
  })
  if (language) params.set("language", language)
  if (bias.country) params.set("country", bias.country.toLowerCase())
  if (bias.proximity) params.set("proximity", bias.proximity.join(","))

  const response = await fetch(`${GEOCODE_V6}/forward?${params}`, { signal })
  if (!response.ok) return []
  const data = (await response.json()) as { features?: V6Feature[] }
  return data.features ?? []
}

/**
 * Autocomplete. Scoped to the school's country and ranked around the school;
 * when the scoped search finds nothing it retries worldwide once, so a family
 * living across a border still finds their place.
 */
export async function suggestPlaces(
  query: string,
  options: {
    language?: string
    bias?: SearchBias
    limit?: number
    signal?: AbortSignal
  } = {}
): Promise<PlaceSuggestion[]> {
  const q = query.trim()
  if (q.length < 2 || !MAPBOX_ACCESS_TOKEN) return []

  const { language, bias = {}, limit = 6, signal } = options
  const key = [
    language ?? "",
    bias.country ?? "",
    bias.proximity?.map((n) => n.toFixed(2)).join(",") ?? "",
    q,
  ].join("|")
  const cached = cacheGet(key)
  if (cached) return cached

  let features = await forward(q, language, bias, limit, signal)
  if (features.length === 0 && bias.country) {
    features = await forward(
      q,
      language,
      { proximity: bias.proximity },
      limit,
      signal
    )
  }

  const suggestions = features.map((f) => toSuggestion(f, language))
  cacheSet(key, suggestions)
  return suggestions
}

/** A point with no geocoder match still needs a usable value. */
function bareLocation(latitude: number, longitude: number): LocationResult {
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

/**
 * Reverse geocoding — the address around an exact point.
 *
 * Keeps the coordinates the caller ASKED about; only the address text comes
 * from the match. The matched feature can be a whole locality whose centroid
 * sits kilometres from a GPS fix or a dragged pin, and that centroid used to
 * be handed back as "your location".
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
  language?: string,
  signal?: AbortSignal
): Promise<LocationResult | null> {
  if (!MAPBOX_ACCESS_TOKEN) return bareLocation(latitude, longitude)

  try {
    const params = new URLSearchParams({
      longitude: String(longitude),
      latitude: String(latitude),
      types: REVERSE_TYPES,
      access_token: MAPBOX_ACCESS_TOKEN,
    })
    if (language) params.set("language", language)

    const response = await fetch(`${GEOCODE_V6}/reverse?${params}`, {
      signal,
    })
    if (!response.ok) return null

    const data = (await response.json()) as { features?: V6Feature[] }
    const feature = data.features?.[0]
    if (!feature) return bareLocation(latitude, longitude)

    return {
      ...featureToLocationResult(feature, language),
      latitude,
      longitude,
    }
  } catch {
    return null
  }
}
