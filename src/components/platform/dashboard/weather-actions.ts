"use server"

import { db } from "@/lib/db"
import { cache } from "@/lib/cache"
import { getTenantContext } from "@/lib/tenant-context"
import type { WeatherCondition, ForecastDay, WeatherConditionType } from "./weather"

// ============================================================================
// TYPES
// ============================================================================

export interface WeatherData {
  current: WeatherCondition
  forecast: ForecastDay[]
  location: string
}

// ============================================================================
// WEATHER CONDITION MAPPING
// ============================================================================

/**
 * Maps OpenWeatherMap condition codes to our WeatherConditionType
 * @see https://openweathermap.org/weather-conditions
 */
function mapCondition(id: number): WeatherConditionType {
  // Thunderstorm (200-299)
  if (id >= 200 && id < 300) return "stormy"
  // Drizzle (300-399)
  if (id >= 300 && id < 400) return "rainy"
  // Rain (500-599)
  if (id >= 500 && id < 505) return "rainy"
  if (id >= 505 && id < 600) return "pouring"
  // Snow (600-699)
  if (id >= 600 && id < 700) return "snowy"
  // Atmosphere - fog, mist, haze (700-799)
  if (id >= 700 && id < 800) return "foggy"
  // Clear (800)
  if (id === 800) return "sunny"
  // Clouds (801-804)
  if (id === 801) return "partlycloudy"
  if (id >= 802) return "cloudy"
  // Default
  return "sunny"
}

/**
 * Capitalizes the first letter of a weather description
 */
function capitalizeDescription(description: string): string {
  return description.charAt(0).toUpperCase() + description.slice(1)
}

// ============================================================================
// SERVER ACTIONS
// ============================================================================

/**
 * Fetches real weather data from OpenWeatherMap API
 * Uses school's latitude/longitude for location
 * Caches results for 30 minutes to minimize API calls
 *
 * @param units - Temperature units: "metric" (°C) or "imperial" (°F)
 * @returns Weather data or null if unavailable
 */
export async function getWeatherData(
  units: "metric" | "imperial" = "metric"
): Promise<WeatherData | null> {
  const { schoolId } = await getTenantContext()
  if (!schoolId) return null

  const cacheKey = `weather:${schoolId}:${units}`

  return cache.get(
    cacheKey,
    async () => {
      // Fetch school coordinates
      const school = await db.school.findUnique({
        where: { id: schoolId },
        select: {
          name: true,
          latitude: true,
          longitude: true,
        },
      })

      if (!school?.latitude || !school?.longitude) {
        console.warn("[Weather] School has no coordinates:", schoolId)
        return null
      }

      const apiKey = process.env.OPENWEATHERMAP_API_KEY
      if (!apiKey) {
        console.warn("[Weather] OPENWEATHERMAP_API_KEY not configured")
        return null
      }

      const lat = Number(school.latitude)
      const lon = Number(school.longitude)

      try {
        const url = new URL("https://api.openweathermap.org/data/3.0/onecall")
        url.searchParams.set("lat", lat.toString())
        url.searchParams.set("lon", lon.toString())
        url.searchParams.set("units", units)
        url.searchParams.set("exclude", "minutely,hourly,alerts")
        url.searchParams.set("appid", apiKey)

        const response = await fetch(url.toString(), {
          next: { revalidate: 1800 }, // 30-minute Next.js cache
        })

        if (!response.ok) {
          console.error("[Weather] API error:", response.status)
          return null
        }

        const data = await response.json()

        // Map current weather
        const currentWeather = data.current.weather[0]
        const current: WeatherCondition = {
          day: new Date().toLocaleDateString("en-US", { weekday: "long" }),
          condition: mapCondition(currentWeather.id),
          conditionLabel: capitalizeDescription(currentWeather.description),
          temperature: Math.round(data.current.temp),
          tempLow: Math.round(data.daily[0].temp.min),
          humidity: data.current.humidity,
          rainChance: Math.round(data.daily[0].pop * 100),
          windSpeed: Math.round(
            data.current.wind_speed * (units === "metric" ? 3.6 : 1) // m/s to km/h
          ),
        }

        // Map 6-day forecast (skip today)
        const forecast: ForecastDay[] = data.daily.slice(1, 7).map((day: any) => {
          const date = new Date(day.dt * 1000)
          const dayWeather = day.weather[0]
          return {
            day: date.toLocaleDateString("en-US", { weekday: "short" }),
            condition: mapCondition(dayWeather.id),
            temp: Math.round(day.temp.day),
          }
        })

        return {
          current,
          forecast,
          location: school.name,
        }
      } catch (error) {
        console.error("[Weather] Fetch error:", error)
        return null
      }
    },
    { ttl: 1800 } // 30-minute in-memory cache
  )
}

/**
 * Refreshes weather data by invalidating cache and fetching fresh data
 * Used when user clicks the refresh button
 *
 * @param units - Temperature units
 * @returns Fresh weather data or null
 */
export async function refreshWeather(
  units: "metric" | "imperial" = "metric"
): Promise<WeatherData | null> {
  const { schoolId } = await getTenantContext()
  if (!schoolId) return null

  // Invalidate cache and fetch fresh data
  const cacheKey = `weather:${schoolId}:${units}`
  cache.invalidate(cacheKey)

  return getWeatherData(units)
}
