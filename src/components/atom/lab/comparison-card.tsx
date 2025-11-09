'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { StatValue } from "./stat-value"
import { StatLabel } from "./stat-label"
import { TrendBadge } from "./trend-badge"
import type { CardSize, ComparisonMetric, TrendData } from "./types"

interface ComparisonCardProps {
  /**
   * Card title
   */
  title: string
  /**
   * Array of metrics to compare (typically 2)
   */
  metrics: ComparisonMetric[]
  /**
   * Overall change data
   */
  change?: TrendData
  /**
   * Card size variant
   * @default "md"
   */
  size?: CardSize
  /**
   * Loading state (shows skeleton)
   */
  loading?: boolean
  /**
   * Click handler for navigation
   */
  onClick?: () => void
  /**
   * Enable hover effect
   * @default false
   */
  hoverable?: boolean
  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * ComparisonCard - Before/after or side-by-side metric comparison
 *
 * Perfect for comparing periods, A/B metrics, or showing change over time.
 *
 * @example
 * ```tsx
 * <ComparisonCard
 *   title="Student Attendance"
 *   metrics={[
 *     { label: "This Week", value: 94, variant: "success" },
 *     { label: "Last Week", value: 89, variant: "default" }
 *   ]}
 *   change={{ value: 5, direction: "up" }}
 *   onClick={() => router.push('/attendance')}
 * />
 * ```
 */
export function ComparisonCard({
  title,
  metrics,
  change,
  size = "md",
  loading = false,
  onClick,
  hoverable = false,
  className,
}: ComparisonCardProps) {
  const sizeClasses = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
    xl: "p-8",
  }

  const isInteractive = onClick || hoverable

  return (
    <Card
      className={cn(
        "transition-colors",
        isInteractive && "cursor-pointer hover:bg-accent/50",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className={cn(sizeClasses[size])}>
        {loading ? (
          <Skeleton className="h-6 w-40" />
        ) : (
          <CardTitle>{title}</CardTitle>
        )}
      </CardHeader>
      <CardContent className={cn(sizeClasses[size], "pt-0")}>
        {loading ? (
          <div className="flex items-center gap-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex-1 space-y-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-6">
              {metrics.map((metric, index) => (
                <div key={index} className="space-y-1">
                  <StatValue
                    value={metric.value}
                    size="lg"
                    variant={metric.variant || "default"}
                  />
                  <StatLabel label={metric.label} />
                </div>
              ))}
            </div>

            {/* VS Badge (optional visual) */}
            {metrics.length === 2 && (
              <div className="flex items-center justify-center">
                <div className="rounded-md border border-border bg-muted px-2 py-1">
                  <small className="font-medium text-muted-foreground">vs</small>
                </div>
              </div>
            )}

            {/* Overall Change */}
            {change && (
              <div className="flex justify-center">
                <TrendBadge
                  value={change.value}
                  direction={change.direction}
                  showIcon
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
