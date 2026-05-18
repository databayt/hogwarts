// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Google Places harvester for MENA school prospects.
 *
 * Hits Places API v1 (Text Search) across a city × query matrix and upserts
 * results into the `Prospect` table with source="gmaps".
 *
 * Usage:
 *   GMAPS_API_KEY=... pnpm tsx scripts/harvest-gmaps.ts
 *   GMAPS_API_KEY=... pnpm tsx scripts/harvest-gmaps.ts --country=SA
 *   GMAPS_API_KEY=... pnpm tsx scripts/harvest-gmaps.ts --dry-run
 *
 * Cost: ~$17/1000 Text Search calls. Full matrix (~40 calls) ≈ $0.68.
 */

import "dotenv/config"

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const GMAPS_API_KEY =
  process.env.GMAPS_API_KEY ?? process.env.GOOGLE_MAPS_API_KEY
const ENDPOINT = "https://places.googleapis.com/v1/places:searchText"
const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.websiteUri",
  "places.rating",
  "places.userRatingCount",
  "places.location",
  "places.types",
].join(",")

type Lang = "ar" | "en" | "fr"
type City = {
  name: string
  country: string // ISO-2
  lat: number
  lng: number
  radius: number // meters
  queries: { text: string; lang: Lang }[]
}

const CITIES: City[] = [
  // Saudi Arabia
  {
    name: "Riyadh",
    country: "SA",
    lat: 24.71,
    lng: 46.67,
    radius: 30000,
    queries: [
      { text: "مدارس أهلية", lang: "ar" },
      { text: "مدارس عالمية", lang: "ar" },
      { text: "international schools", lang: "en" },
    ],
  },
  {
    name: "Jeddah",
    country: "SA",
    lat: 21.49,
    lng: 39.19,
    radius: 30000,
    queries: [
      { text: "مدارس أهلية", lang: "ar" },
      { text: "international schools", lang: "en" },
    ],
  },
  {
    name: "Dammam",
    country: "SA",
    lat: 26.39,
    lng: 49.97,
    radius: 25000,
    queries: [{ text: "مدارس خاصة", lang: "ar" }],
  },
  {
    name: "Madinah",
    country: "SA",
    lat: 24.47,
    lng: 39.61,
    radius: 20000,
    queries: [{ text: "مدارس أهلية", lang: "ar" }],
  },
  {
    name: "Makkah",
    country: "SA",
    lat: 21.39,
    lng: 39.86,
    radius: 20000,
    queries: [{ text: "مدارس أهلية", lang: "ar" }],
  },
  // Sudan
  {
    name: "Khartoum",
    country: "SD",
    lat: 15.5,
    lng: 32.56,
    radius: 25000,
    queries: [
      { text: "مدارس خاصة", lang: "ar" },
      { text: "private schools", lang: "en" },
    ],
  },
  {
    name: "Omdurman",
    country: "SD",
    lat: 15.65,
    lng: 32.48,
    radius: 20000,
    queries: [{ text: "مدارس خاصة", lang: "ar" }],
  },
  {
    name: "Port Sudan",
    country: "SD",
    lat: 19.62,
    lng: 37.22,
    radius: 20000,
    queries: [{ text: "مدارس خاصة", lang: "ar" }],
  },
  // Egypt
  {
    name: "Cairo",
    country: "EG",
    lat: 30.04,
    lng: 31.24,
    radius: 30000,
    queries: [
      { text: "مدارس لغات", lang: "ar" },
      { text: "language schools", lang: "en" },
    ],
  },
  {
    name: "Alexandria",
    country: "EG",
    lat: 31.2,
    lng: 29.92,
    radius: 25000,
    queries: [{ text: "مدارس لغات", lang: "ar" }],
  },
  {
    name: "Giza",
    country: "EG",
    lat: 30.01,
    lng: 31.21,
    radius: 25000,
    queries: [{ text: "مدارس لغات", lang: "ar" }],
  },
  // UAE
  {
    name: "Dubai",
    country: "AE",
    lat: 25.2,
    lng: 55.27,
    radius: 30000,
    queries: [{ text: "international schools", lang: "en" }],
  },
  {
    name: "Abu Dhabi",
    country: "AE",
    lat: 24.45,
    lng: 54.39,
    radius: 30000,
    queries: [{ text: "international schools", lang: "en" }],
  },
  {
    name: "Sharjah",
    country: "AE",
    lat: 25.35,
    lng: 55.39,
    radius: 20000,
    queries: [{ text: "international schools", lang: "en" }],
  },
  // Jordan
  {
    name: "Amman",
    country: "JO",
    lat: 31.95,
    lng: 35.93,
    radius: 25000,
    queries: [
      { text: "مدارس خاصة", lang: "ar" },
      { text: "private schools", lang: "en" },
    ],
  },
  // Morocco
  {
    name: "Casablanca",
    country: "MA",
    lat: 33.57,
    lng: -7.59,
    radius: 30000,
    queries: [{ text: "écoles privées", lang: "fr" }],
  },
  {
    name: "Rabat",
    country: "MA",
    lat: 34.02,
    lng: -6.83,
    radius: 20000,
    queries: [{ text: "écoles privées", lang: "fr" }],
  },
]

interface PlaceResult {
  id: string
  displayName?: { text: string; languageCode: string }
  formattedAddress?: string
  nationalPhoneNumber?: string
  internationalPhoneNumber?: string
  websiteUri?: string
  rating?: number
  userRatingCount?: number
  location?: { latitude: number; longitude: number }
  types?: string[]
}

interface SearchResponse {
  places?: PlaceResult[]
}

async function searchCity(
  city: City,
  query: { text: string; lang: Lang }
): Promise<PlaceResult[]> {
  const body = {
    textQuery: query.text,
    languageCode: query.lang,
    maxResultCount: 20,
    locationBias: {
      circle: {
        center: { latitude: city.lat, longitude: city.lng },
        radius: city.radius,
      },
    },
  }

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GMAPS_API_KEY!,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Places API ${res.status}: ${text.slice(0, 200)}`)
  }

  const data: SearchResponse = await res.json()
  return data.places ?? []
}

async function upsertPlace(
  place: PlaceResult,
  city: City,
  sourceQuery: string,
  lang: Lang
) {
  if (!place.id) return null
  const name = place.displayName?.text ?? place.formattedAddress ?? place.id

  return prisma.prospect.upsert({
    where: { gmapsPlaceId: place.id },
    create: {
      gmapsPlaceId: place.id,
      name,
      country: city.country,
      city: city.name,
      address: place.formattedAddress,
      phone: place.internationalPhoneNumber ?? place.nationalPhoneNumber,
      website: place.websiteUri,
      gmapsRating: place.rating,
      gmapsRatingCount: place.userRatingCount,
      latitude: place.location?.latitude,
      longitude: place.location?.longitude,
      language: lang === "ar" ? "ar" : lang === "fr" ? "fr" : "en",
      source: "gmaps",
      sourceQuery,
      status: "new",
    },
    update: {
      name,
      address: place.formattedAddress ?? undefined,
      phone:
        place.internationalPhoneNumber ??
        place.nationalPhoneNumber ??
        undefined,
      website: place.websiteUri ?? undefined,
      gmapsRating: place.rating ?? undefined,
      gmapsRatingCount: place.userRatingCount ?? undefined,
    },
  })
}

async function main() {
  if (!GMAPS_API_KEY) {
    console.error(
      "Missing GMAPS_API_KEY (or GOOGLE_MAPS_API_KEY) in environment."
    )
    process.exit(1)
  }

  const args = new Set(process.argv.slice(2))
  const dryRun = args.has("--dry-run")
  const countryFilter = [...args]
    .find((a) => a.startsWith("--country="))
    ?.split("=")[1]
    ?.toUpperCase()

  const cities = countryFilter
    ? CITIES.filter((c) => c.country === countryFilter)
    : CITIES

  console.log(
    `Harvester: ${cities.length} cities, ${cities.reduce(
      (n, c) => n + c.queries.length,
      0
    )} queries. dryRun=${dryRun}`
  )

  let totalFound = 0
  let totalUpserted = 0
  let errors = 0

  for (const city of cities) {
    for (const q of city.queries) {
      const tag = `${city.country}/${city.name}/"${q.text}"`
      try {
        const places = await searchCity(city, q)
        totalFound += places.length
        if (dryRun) {
          console.log(`  ${tag}: ${places.length} results (dry-run)`)
        } else {
          for (const p of places) {
            const row = await upsertPlace(p, city, q.text, q.lang)
            if (row) totalUpserted += 1
          }
          console.log(`  ${tag}: ${places.length} found, upserted`)
        }
      } catch (err) {
        errors += 1
        console.error(`  ${tag}: ${(err as Error).message}`)
      }
      // 50ms gap to stay well under Places API rate ceiling
      await new Promise((r) => setTimeout(r, 50))
    }
  }

  console.log(
    `\nDone. found=${totalFound} upserted=${totalUpserted} errors=${errors}`
  )
  await prisma.$disconnect()
}

main().catch(async (err) => {
  console.error(err)
  await prisma.$disconnect()
  process.exit(1)
})
