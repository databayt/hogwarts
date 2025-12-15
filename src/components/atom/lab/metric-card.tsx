"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import { Sparkline } from "./sparkline"
import { StatLabel } from "./stat-label"
import { StatValue } from "./stat-value"
import { TrendBadge } from "./trend-badge"
import type { BaseVariant, CardSize, TrendData } from "./types"

interface MetricCardProps {
  /**
   * Metric value
   */
  value: string | number
  /**
   * Metric label
   */
  label: string
  /**
   * Sparkline data
   */
  data: number[]
  /**
   * Trend information
   */
  trend?: TrendData
  /**
   * Visual variant
   * @default "default"
   */
  variant?: BaseVariant
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
 * MetricCard - Metric with inline sparkline chart
 *
 * Perfect for showing trends alongside current values.
 * Combines stat display with visual data representation.
 *
 * @example
 * ```tsx
 * <MetricCard
 *   value="$45,231"
 *   label="Revenue"
 *   data={[40, 45, 42, 48, 50, 45, 51]}
 *   trend={{ value: 12.5, direction: "up" }}
 *   variant="success"
 *   onClick={() => router.push('/revenue')}
 * />
 * ```
 */
export function MetricCard({
  value,
  label,
  data,
  trend,
  variant = "default",
  size = "md",
  loading = false,
  onClick,
  className,
}: MetricCardProps) {
  const sizeClasses = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
    xl: "p-8",
  }

  const sparklineHeights = {
    sm: 24,
    md: 32,
    lg: 40,
    xl: 48,
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
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <StatValue value={value} size="lg" variant={variant} />
                <StatLabel label={label} />
              </div>
              {trend && (
                <TrendBadge
                  value={trend.value}
                  direction={trend.direction}
                  showIcon
                />
              )}
            </div>
            <Sparkline
              data={data}
              type="area"
              variant={variant}
              height={sparklineHeights[size]}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
