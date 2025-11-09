'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { StatGroup } from "./stat-group"
import type { CardSize, StatData } from "./types"

interface MultiStatCardProps {
  /**
   * Optional card title
   */
  title?: string
  /**
   * Array of statistics to display
   */
  stats: StatData[]
  /**
   * Number of columns in the grid
   * @default 2
   */
  columns?: 2 | 3 | 4
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

const columnStyles = {
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
}

/**
 * MultiStatCard - Display multiple statistics in a grid
 *
 * @example
 * ```tsx
 * <MultiStatCard
 *   title="Class Overview"
 *   stats={[
 *     { value: 28, label: "Total Students", trend: { value: 2, direction: "up" } },
 *     { value: "94%", label: "Attendance", trend: { value: 3, direction: "up" } },
 *     { value: 12, label: "Pending" }
 *   ]}
 *   columns={3}
 *   size="lg"
 *   onClick={() => router.push('/overview')}
 *   hoverable
 * />
 * ```
 */
export function MultiStatCard({
  title,
  stats,
  columns = 2,
  size = "md",
  loading = false,
  onClick,
  hoverable = false,
  className,
}: MultiStatCardProps) {
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
      {title && (
        <CardHeader className={cn(sizeClasses[size])}>
          {loading ? (
            <Skeleton className="h-6 w-32" />
          ) : (
            <CardTitle>{title}</CardTitle>
          )}
        </CardHeader>
      )}
      <CardContent className={cn(sizeClasses[size], title && "pt-0")}>
        <div className={cn("grid gap-6", columnStyles[columns])}>
          {loading
            ? [...Array(columns)].map((_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))
            : stats.map((stat, index) => (
                <StatGroup
                  key={index}
                  value={stat.value}
                  label={stat.label}
                  trend={stat.trend}
                />
              ))}
        </div>
      </CardContent>
    </Card>
  )
}
