"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Droplets,
  Wind,
  Thermometer,
  RefreshCcw,
  Loader2,
} from "lucide-react"
import Icon from "@mdi/react"
import {
  mdiWeatherSunny,
  mdiWeatherPartlyCloudy,
  mdiWeatherCloudy,
  mdiWeatherRainy,
  mdiWeatherPouring,
  mdiWeatherSnowy,
  mdiWeatherWindy,
  mdiWeatherFog,
  mdiWeatherLightning,
} from "@mdi/js"

// ============================================================================
// TYPES
// ============================================================================

export interface WeatherCondition {
  day: string
  condition: WeatherConditionType
  conditionLabel: string
  temperature: number
  tempLow: number
  humidity: number
  rainChance: number
  windSpeed: number
}

export interface ForecastDay {
  day: string
  condition: WeatherConditionType
  temp: number
}

export type WeatherConditionType =
  | "sunny"
  | "partlycloudy"
  | "cloudy"
  | "rainy"
  | "pouring"
  | "snowy"
  | "windy"
  | "foggy"
  | "stormy"

export interface WeatherProps {
  /** Current weather conditions */
  current?: WeatherCondition | null
  /** 6-day forecast array */
  forecast?: ForecastDay[]
  /** Location name (optional) */
  location?: string
  /** Temperature units */
  units?: "metric" | "imperial"
  /** Callback when refresh is clicked */
  onRefresh?: () => Promise<void> | void
  /** Loading state */
  isLoading?: boolean
  /** Error message */
  error?: string
  /** Additional CSS classes */
  className?: string
}

// ============================================================================
// WEATHER ICON MAPPING
// ============================================================================

const weatherIconMap: Record<WeatherConditionType, string> = {
  sunny: mdiWeatherSunny,
  partlycloudy: mdiWeatherPartlyCloudy,
  cloudy: mdiWeatherCloudy,
  rainy: mdiWeatherRainy,
  pouring: mdiWeatherPouring,
  snowy: mdiWeatherSnowy,
  windy: mdiWeatherWindy,
  foggy: mdiWeatherFog,
  stormy: mdiWeatherLightning,
}

function WeatherIcon({
  condition,
  className,
}: {
  condition: WeatherConditionType
  className?: string
}) {
  return (
    <Icon
      path={weatherIconMap[condition] || mdiWeatherSunny}
      className={cn("size-6", className)}
    />
  )
}

// ============================================================================
// DEFAULT/MOCK DATA
// ============================================================================

const defaultCurrentWeather: WeatherCondition = {
  day: new Date().toLocaleDateString("en-US", { weekday: "long" }),
  condition: "sunny",
  conditionLabel: "Sunny",
  temperature: 24,
  tempLow: 18,
  humidity: 45,
  rainChance: 10,
  windSpeed: 12,
}

const defaultForecast: ForecastDay[] = [
  { day: "Tue", condition: "partlycloudy", temp: 22 },
  { day: "Wed", condition: "cloudy", temp: 20 },
  { day: "Thu", condition: "rainy", temp: 18 },
  { day: "Fri", condition: "pouring", temp: 16 },
  { day: "Sat", condition: "cloudy", temp: 19 },
  { day: "Sun", condition: "sunny", temp: 23 },
]

// ============================================================================
// WEATHER COMPONENT
// ============================================================================

/**
 * Weather component displaying current conditions and 6-day forecast.
 * Supports real weather data via props or uses mock data as fallback.
 *
 * @example
 * // With real data
 * <Weather
 *   current={weatherData.current}
 *   forecast={weatherData.forecast}
 *   onRefresh={handleRefresh}
 * />
 *
 * @example
 * // With default mock data
 * <Weather />
 */
export function Weather({
  current,
  forecast,
  location,
  units = "metric",
  onRefresh,
  isLoading = false,
  error,
  className,
}: WeatherProps) {
  const [refreshing, setRefreshing] = useState(false)

  // Use provided data or fall back to defaults
  const currentWeather = current || defaultCurrentWeather
  const forecastData = forecast || defaultForecast

  const handleRefresh = useCallback(async () => {
    if (!onRefresh || refreshing) return

    setRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setRefreshing(false)
    }
  }, [onRefresh, refreshing])

  const tempUnit = units === "metric" ? "C" : "F"
  const speedUnit = units === "metric" ? "km/h" : "mph"

  if (error) {
    return (
      <div
        className={cn(
          "w-full max-w-sm h-[280px] flex flex-col items-center justify-center text-center p-4",
          className
        )}
      >
        <p className="text-sm text-muted-foreground mb-2">
          Unable to load weather data
        </p>
        {onRefresh && (
          <Button variant="ghost" size="sm" onClick={handleRefresh}>
            <RefreshCcw className="size-4 mr-2" />
            Retry
          </Button>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "w-full max-w-sm h-[280px] flex flex-col justify-between",
        className
      )}
    >
      <div>
        {/* Header with day, condition, and refresh */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-lg font-medium">{currentWeather.day}</p>
              <div className="flex items-center gap-1 text-muted-foreground">
                <WeatherIcon
                  condition={currentWeather.condition}
                  className="size-5"
                />
                <span className="text-sm">
                  ({currentWeather.conditionLabel})
                </span>
              </div>
            </div>

            {location && (
              <p className="text-sm text-muted-foreground">{location}</p>
            )}

            {/* Weather details */}
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Droplets className="size-4" />
                <span>Humidity: {currentWeather.humidity}%</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="text-primary">
                  Rain: {currentWeather.rainChance}%
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Thermometer className="size-4" />
                <span>
                  {currentWeather.temperature}°{tempUnit} (
                  {currentWeather.tempLow}°{tempUnit})
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Wind className="size-4" />
                <span>
                  {currentWeather.windSpeed} {speedUnit}
                </span>
              </div>
            </div>
          </div>

          {/* Refresh button */}
          <Button
            size="icon"
            variant="ghost"
            onClick={handleRefresh}
            disabled={refreshing || isLoading}
          >
            {refreshing || isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCcw className="size-4" />
            )}
          </Button>
        </div>

        {/* 6-day forecast strip */}
        <div className="mt-4 flex justify-between rounded-lg bg-muted/50 p-3">
          {forecastData.slice(0, 6).map((item) => (
            <div key={item.day} className="flex flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground">{item.day}</span>
              <WeatherIcon condition={item.condition} className="size-5" />
              <span className="text-sm font-medium">
                {item.temp}°{tempUnit.charAt(0)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// COMPACT WEATHER (For smaller spaces)
// ============================================================================

export interface CompactWeatherProps {
  condition?: WeatherConditionType
  temperature?: number
  className?: string
}

/**
 * Compact weather display showing just icon and temperature
 */
export function CompactWeather({
  condition = "sunny",
  temperature = 24,
  className,
}: CompactWeatherProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <WeatherIcon condition={condition} className="size-5" />
      <span className="text-sm font-medium">{temperature}°</span>
    </div>
  )
}
