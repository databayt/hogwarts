"use client"

import {
  mdiWeatherCloudy,
  mdiWeatherPartlyCloudy,
  mdiWeatherPouring,
  mdiWeatherRainy,
  mdiWeatherSnowy,
  mdiWeatherSunny,
  mdiWeatherWindy,
} from "@mdi/js"
import Icon from "@mdi/react"
import { Droplets, RefreshCcw, Thermometer, Wind } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const currentWeather = {
  day: "Monday",
  condition: "sunny",
  conditionLabel: "Sunny",
  temperature: 24,
  tempLow: 18,
  humidity: 45,
  rainChance: 10,
  windSpeed: 12,
}

const forecast = [
  { day: "Tue", condition: "partlycloudy", temp: 22 },
  { day: "Wed", condition: "cloudy", temp: 20 },
  { day: "Thu", condition: "rainy", temp: 18 },
  { day: "Fri", condition: "pouring", temp: 16 },
  { day: "Sat", condition: "cloudy", temp: 19 },
  { day: "Sun", condition: "sunny", temp: 23 },
]

function WeatherIcon({
  condition,
  className,
}: {
  condition: string
  className?: string
}) {
  const iconMap: Record<string, string> = {
    sunny: mdiWeatherSunny,
    partlycloudy: mdiWeatherPartlyCloudy,
    cloudy: mdiWeatherCloudy,
    rainy: mdiWeatherRainy,
    pouring: mdiWeatherPouring,
    snowy: mdiWeatherSnowy,
    windy: mdiWeatherWindy,
  }

  return (
    <Icon
      path={iconMap[condition] || mdiWeatherSunny}
      className={cn("size-6", className)}
    />
  )
}

export default function StatsWeather() {
  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-6">
        {/* Header with current weather */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-lg font-medium">{currentWeather.day}</p>
              <div className="text-muted-foreground flex items-center gap-1">
                <WeatherIcon
                  condition={currentWeather.condition}
                  className="size-5"
                />
                <span className="text-sm">
                  ({currentWeather.conditionLabel})
                </span>
              </div>
            </div>

            {/* Weather metrics */}
            <div className="mt-3 space-y-2">
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Droplets className="size-4" />
                <span>Humidity: {currentWeather.humidity}%</span>
              </div>
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <span className="text-primary">
                  Rain: {currentWeather.rainChance}%
                </span>
              </div>
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Thermometer className="size-4" />
                <span>
                  {currentWeather.temperature}° ({currentWeather.tempLow}°)
                </span>
              </div>
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Wind className="size-4" />
                <span>{currentWeather.windSpeed} km/h</span>
              </div>
            </div>
          </div>

          <Button size="icon" variant="ghost">
            <RefreshCcw className="size-4" />
          </Button>
        </div>

        {/* Forecast strip */}
        <div className="bg-muted/50 mt-6 flex justify-between rounded-lg p-3">
          {forecast.map((item) => (
            <div key={item.day} className="flex flex-col items-center gap-1">
              <span className="text-muted-foreground text-xs">{item.day}</span>
              <WeatherIcon condition={item.condition} className="size-6" />
              <span className="text-sm font-medium">{item.temp}°</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
