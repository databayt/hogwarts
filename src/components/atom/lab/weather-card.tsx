"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import type { CardSize } from "./types"

interface WeatherCardProps {
  /**
   * Weather icon element
   */
  icon: React.ReactNode
  /**
   * Temperature or main stat
   */
  temperature: string
  /**
   * Location or label
   */
  location: string
  /**
   * Weather condition
   */
  condition: string
  /**
   * Additional stats (humidity, wind, etc.)
   */
  stats?: Array<{ label: string; value: string }>
  /**
   * Card size variant
   * @default "md"
   */
  size?: CardSize
  /**
   * Loading state
   */
  loading?: boolean
  /**
   * Click handler
   */
  onClick?: () => void
  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * WeatherCard - Weather/status information card
 *
 * Perfect for showing weather data, system status, or environmental metrics.
 * Can be adapted for any icon + primary stat + secondary stats layout.
 *
 * @example
 * ```tsx
 * <WeatherCard
 *   icon={<Sun className="h-16 w-16 text-chart-3" />}
 *   temperature="72°F"
 *   location="San Francisco, CA"
 *   condition="Sunny"
 *   stats={[
 *     { label: "Humidity", value: "45%" },
 *     { label: "Wind", value: "12 mph" }
 *   ]}
 * />
 * ```
 */
export function WeatherCard({
  icon,
  temperature,
  location,
  condition,
  stats,
  size = "md",
  loading = false,
  onClick,
  className,
}: WeatherCardProps) {
  const sizeClasses = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
    xl: "p-8",
  }

  const isInteractive = !!onClick

  return (
    <Card
      className={cn(
        "transition-colors",
        isInteractive && "hover:bg-accent/50 cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <CardContent className={cn(sizeClasses[size])}>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="mx-auto h-16 w-16 rounded-full" />
            <Skeleton className="mx-auto h-8 w-20" />
            <Skeleton className="mx-auto h-4 w-32" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Icon */}
            <div className="flex justify-center">{icon}</div>

            {/* Primary Stat */}
            <div className="space-y-1 text-center">
              <h2 className="text-foreground font-bold">{temperature}</h2>
              <p className="text-foreground font-medium">{location}</p>
              <p className="muted">{condition}</p>
            </div>

            {/* Secondary Stats */}
            {stats && stats.length > 0 && (
              <div className="border-border grid grid-cols-2 gap-3 border-t pt-2">
                {stats.map((stat, index) => (
                  <div key={index} className="space-y-0.5 text-center">
                    <p className="muted">{stat.label}</p>
                    <p className="text-foreground font-medium">{stat.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
