"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import { TrendBadge } from "./trend-badge"
import type { CardSize, TrendData } from "./types"

interface StackedStat {
  /**
   * Stat label
   */
  label: string
  /**
   * Stat value
   */
  value: string | number
  /**
   * Optional unit
   */
  unit?: string
  /**
   * Optional icon
   */
  icon?: React.ReactNode
  /**
   * Optional trend data
   */
  trend?: TrendData
  /**
   * Color variant
   */
  variant?: "default" | "primary" | "success" | "warning" | "danger"
}

interface StackedStatCardProps {
  /**
   * Card title
   */
  title?: string
  /**
   * List of stacked stats
   */
  stats: StackedStat[]
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
   * Show dividers between stats
   * @default true
   */
  showDividers?: boolean
  /**
   * Additional CSS classes
   */
  className?: string
}

const variantColors = {
  default: "text-foreground",
  primary: "text-primary",
  success: "text-chart-2",
  warning: "text-chart-3",
  danger: "text-destructive",
}

/**
 * StackedStatCard - Multiple metrics stacked vertically
 *
 * Perfect for displaying related metrics in a compact vertical layout.
 * Shows multiple stats with labels, values, icons, and optional trends.
 *
 * @example
 * ```tsx
 * <StackedStatCard
 *   title="Quick Stats"
 *   stats={[
 *     {
 *       label: "Total Revenue",
 *       value: "$45,678",
 *       icon: <DollarSign className="h-4 w-4" />,
 *       trend: { value: 12, direction: "up" },
 *       variant: "success"
 *     },
 *     {
 *       label: "Active Users",
 *       value: 1234,
 *       icon: <Users className="h-4 w-4" />,
 *       trend: { value: 5, direction: "up" },
 *       variant: "primary"
 *     },
 *     {
 *       label: "Pending Tasks",
 *       value: 23,
 *       unit: "items",
 *       icon: <Clock className="h-4 w-4" />,
 *       variant: "warning"
 *     }
 *   ]}
 *   onClick={() => router.push('/overview')}
 * />
 * ```
 */
export function StackedStatCard({
  title,
  stats,
  size = "md",
  loading = false,
  onClick,
  showDividers = true,
  className,
}: StackedStatCardProps) {
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
      {title && (
        <CardHeader className={cn(sizeClasses[size], "pb-3")}>
          {loading ? (
            <Skeleton className="h-5 w-32" />
          ) : (
            <CardTitle>{title}</CardTitle>
          )}
        </CardHeader>
      )}
      <CardContent className={cn(sizeClasses[size], title && "pt-0")}>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <div className="flex items-baseline gap-2">
                  <Skeleton className="h-7 w-20" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className={cn(
              "space-y-4",
              showDividers && "divide-border divide-y"
            )}
          >
            {stats.map((stat, index) => (
              <div
                key={index}
                className={cn("space-y-2", showDividers && index > 0 && "pt-4")}
              >
                {/* Label with Icon */}
                <div className="muted flex items-center gap-2">
                  {stat.icon && <span className="shrink-0">{stat.icon}</span>}
                  <span className="text-sm">{stat.label}</span>
                </div>

                {/* Value and Trend */}
                <div className="flex flex-wrap items-baseline gap-2">
                  <h3
                    className={cn(
                      "font-bold",
                      variantColors[stat.variant || "default"]
                    )}
                  >
                    {typeof stat.value === "number"
                      ? stat.value.toLocaleString()
                      : stat.value}
                  </h3>
                  {stat.unit && <span className="muted">{stat.unit}</span>}
                  {stat.trend && (
                    <TrendBadge
                      value={stat.trend.value}
                      direction={stat.trend.direction}
                      showIcon
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
