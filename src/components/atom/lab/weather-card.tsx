'use client'

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
        isInteractive && "cursor-pointer hover:bg-accent/50",
        className
      )}
      onClick={onClick}
    >
      <CardContent className={cn(sizeClasses[size])}>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-16 rounded-full mx-auto" />
            <Skeleton className="h-8 w-20 mx-auto" />
            <Skeleton className="h-4 w-32 mx-auto" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Icon */}
            <div className="flex justify-center">{icon}</div>

            {/* Primary Stat */}
            <div className="text-center space-y-1">
              <h2 className="font-bold text-foreground">{temperature}</h2>
              <p className="font-medium text-foreground">{location}</p>
              <p className="muted">{condition}</p>
            </div>

            {/* Secondary Stats */}
            {stats && stats.length > 0 && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center space-y-0.5">
                    <p className="muted">{stat.label}</p>
                    <p className="font-medium text-foreground">{stat.value}</p>
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
