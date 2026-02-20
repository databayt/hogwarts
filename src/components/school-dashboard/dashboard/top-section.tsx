"use client"

import { useState } from "react"
import Link from "next/link"
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
import {
  ArrowRight,
  Droplets,
  RefreshCcw,
  Repeat2,
  Thermometer,
  Wind,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// ============================================================================
// WEATHER HELPERS
// ============================================================================

const weatherIconMap: Record<string, string> = {
  sunny: mdiWeatherSunny,
  partlycloudy: mdiWeatherPartlyCloudy,
  cloudy: mdiWeatherCloudy,
  rainy: mdiWeatherRainy,
  pouring: mdiWeatherPouring,
  snowy: mdiWeatherSnowy,
  windy: mdiWeatherWindy,
}

function WeatherIcon({
  condition,
  className,
}: {
  condition: string
  className?: string
}) {
  return (
    <Icon
      path={weatherIconMap[condition] || mdiWeatherSunny}
      className={cn("size-6", className)}
    />
  )
}

// Mock weather data (would be replaced with real API in production)
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

// ============================================================================
// UPCOMING CLASS CARD
// ============================================================================

export interface UpcomingClassData {
  title: string
  subtitle: string
  description: string
  details: Array<{ label: string; value: string }>
}

function UpcomingClassCard({
  locale,
  subdomain,
  data,
}: {
  locale: string
  subdomain: string
  data?: UpcomingClassData | null
}) {
  const [isFlipped, setIsFlipped] = useState(false)

  const upcomingClass = data || {
    title: "No timetable configured",
    subtitle: "Set up your timetable to see upcoming classes",
    description: "Configure your school timetable",
    details: [
      { label: "Time", value: "--:--" },
      { label: "Room", value: "N/A" },
      { label: "Duration", value: "N/A" },
      { label: "Students", value: "0" },
    ],
  }

  return (
    <div
      className="group relative h-[280px] w-full max-w-[280px] [perspective:2000px]"
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
    >
      <div
        className={cn(
          "relative h-full w-full",
          "[transform-style:preserve-3d]",
          "transition-all duration-700",
          isFlipped
            ? "[transform:rotateY(180deg)]"
            : "[transform:rotateY(0deg)]"
        )}
      >
        {/* Front of card */}
        <div
          className={cn(
            "absolute inset-0 h-full w-full",
            "[transform:rotateY(0deg)] [backface-visibility:hidden]",
            "overflow-hidden rounded-2xl",
            "bg-card",
            "border",
            "shadow-sm",
            "transition-all duration-700",
            "group-hover:shadow-lg",
            isFlipped ? "opacity-0" : "opacity-100"
          )}
        >
          <div className="from-muted/50 to-background relative h-full overflow-hidden bg-gradient-to-b">
            <div className="absolute inset-0 flex items-start justify-center pt-16">
              <div className="relative flex h-[80px] w-[160px] items-center justify-center">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "absolute h-[40px] w-[40px]",
                      "rounded-[140px]",
                      "animate-pulse",
                      "opacity-20",
                      "bg-primary/30"
                    )}
                    style={{
                      animationDelay: `${i * 0.3}s`,
                      transform: `scale(${1 + i * 0.2})`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="absolute right-0 bottom-0 left-0 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <h3 className="text-foreground text-base leading-snug font-semibold tracking-tighter">
                  {upcomingClass.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {upcomingClass.subtitle}
                </p>
              </div>
              <Repeat2 className="text-primary h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Back of card */}
        <div
          className={cn(
            "absolute inset-0 h-full w-full",
            "[transform:rotateY(180deg)] [backface-visibility:hidden]",
            "flex flex-col rounded-2xl border p-5",
            "from-muted/50 to-background bg-gradient-to-b",
            "shadow-sm",
            !isFlipped ? "opacity-0" : "opacity-100"
          )}
        >
          <div className="flex-1 space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-semibold">{upcomingClass.title}</h3>
              <p className="text-muted-foreground text-sm">
                {upcomingClass.description}
              </p>
            </div>

            <div className="space-y-2">
              {upcomingClass.details.map((detail, index) => (
                <div
                  key={detail.label}
                  className="flex items-center justify-between text-sm"
                  style={{
                    transform: isFlipped
                      ? "translateX(0)"
                      : "translateX(-10px)",
                    opacity: isFlipped ? 1 : 0,
                    transitionDelay: `${index * 100 + 200}ms`,
                  }}
                >
                  <span className="text-muted-foreground">{detail.label}</span>
                  <span className="font-medium">{detail.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 border-t pt-4">
            <Link
              href={`/${locale}/s/${subdomain}/timetable`}
              className="bg-muted/50 hover:bg-primary/10 flex items-center justify-between rounded-lg p-2 transition-colors"
            >
              <span className="text-sm font-medium">View Timetable</span>
              <ArrowRight className="text-primary h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// TOP SECTION (UPCOMING CLASS + WEATHER)
// ============================================================================

export interface TopSectionProps {
  locale: string
  subdomain: string
  upcomingClass?: UpcomingClassData | null
}

export function TopSection({
  locale,
  subdomain,
  upcomingClass,
}: TopSectionProps) {
  return (
    <section>
      <div className="flex flex-wrap items-start gap-8">
        {/* Upcoming Class Card */}
        <UpcomingClassCard
          locale={locale}
          subdomain={subdomain}
          data={upcomingClass}
        />

        {/* Weather */}
        <div className="flex h-[280px] w-full max-w-sm flex-col justify-between">
          <div>
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

            <div className="bg-muted/50 mt-4 flex justify-between rounded-lg p-3">
              {forecast.map((item) => (
                <div
                  key={item.day}
                  className="flex flex-col items-center gap-1"
                >
                  <span className="text-muted-foreground text-xs">
                    {item.day}
                  </span>
                  <WeatherIcon condition={item.condition} className="size-5" />
                  <span className="text-sm font-medium">{item.temp}°</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
