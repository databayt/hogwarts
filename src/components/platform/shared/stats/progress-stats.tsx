"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import type { ProgressStatItem, StatGridConfig, StatVariant } from "./types"

interface ProgressStatsProps {
  /** Array of progress stat items */
  items: ProgressStatItem[]
  /** Optional title for the stats section */
  title?: string
  /** Grid configuration */
  grid?: StatGridConfig
  /** Loading state */
  loading?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * ProgressStats - Display metrics with progress bars
 * Based on blocks.so stats-09 pattern
 *
 * @example
 * ```tsx
 * <ProgressStats
 *   title="Resource Usage"
 *   items={[
 *     { label: "Storage", value: "37 GB", limit: "100 GB", percentage: 37 },
 *     { label: "Bandwidth", value: "85%", percentage: 85, variant: "warning" },
 *   ]}
 * />
 * ```
 */
export function ProgressStats({
  items,
  title,
  grid = { mobile: 1, tablet: 2, desktop: 4 },
  loading = false,
  className,
}: ProgressStatsProps) {
  const gridClasses = cn(
    "grid gap-4",
    grid.mobile === 1 ? "grid-cols-1" : "grid-cols-2",
    grid.tablet === 1 && "sm:grid-cols-1",
    grid.tablet === 2 && "sm:grid-cols-2",
    grid.tablet === 3 && "sm:grid-cols-3",
    grid.desktop === 1 && "lg:grid-cols-1",
    grid.desktop === 2 && "lg:grid-cols-2",
    grid.desktop === 3 && "lg:grid-cols-3",
    grid.desktop === 4 && "lg:grid-cols-4"
  )

  if (loading) {
    return (
      <div className={className}>
        {title && <Skeleton className="h-6 w-40 mb-4" />}
        <div className={gridClasses}>
          {Array.from({ length: items.length || 4 }).map((_, i) => (
            <ProgressStatSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {title && <h3 className="mb-4">{title}</h3>}
      <div className={gridClasses}>
        {items.map((item) => (
          <ProgressStatCard key={item.label} item={item} />
        ))}
      </div>
    </div>
  )
}

function ProgressStatCard({ item }: { item: ProgressStatItem }) {
  const progressColor = getProgressColor(item.variant, item.percentage)

  return (
    <Card className="py-4">
      <CardContent>
        <p className="text-sm text-muted-foreground">{item.label}</p>
        <p className="text-2xl font-semibold text-foreground">
          {item.value}
        </p>
        <Progress
          value={Math.min(item.percentage, 100)}
          className={cn("mt-4 h-2", progressColor)}
        />
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className={cn("font-medium", getTextColor(item.variant, item.percentage))}>
            {item.percentage.toFixed(1)}%
          </span>
          {item.limit && (
            <span className="text-muted-foreground">
              {item.value} of {item.limit}
            </span>
          )}
        </div>
        {item.status && (
          <p className={cn("mt-2 text-sm", getStatusColor(item.variant))}>
            {item.status}
          </p>
        )}
        {item.warning && (
          <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
            {item.warning}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Single progress stat for inline use
 */
export function ProgressStatInline({
  label,
  value,
  limit,
  percentage,
  variant,
  className,
}: ProgressStatItem & { className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-muted-foreground">
          {value} {limit && `/ ${limit}`}
        </span>
      </div>
      <Progress
        value={Math.min(percentage, 100)}
        className={cn("h-2", getProgressColor(variant, percentage))}
      />
    </div>
  )
}

/**
 * Stacked progress bars for pipeline/funnel views
 */
export function ProgressStatStacked({
  items,
  title,
  total,
  className,
}: {
  items: Array<{ label: string; value: number; color: string }>
  title?: string
  total: number
  className?: string
}) {
  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={cn(!title && "pt-6", "space-y-4")}>
        {items.map((item) => {
          const percentage = total > 0 ? (item.value / total) * 100 : 0
          return (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{item.label}</span>
                <span className="text-sm text-muted-foreground">
                  {item.value} ({percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn("h-full transition-all duration-300", item.color)}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

function ProgressStatSkeleton() {
  return (
    <Card className="py-4">
      <CardContent>
        <Skeleton className="h-4 w-20 mb-2" />
        <Skeleton className="h-8 w-24 mb-4" />
        <Skeleton className="h-2 w-full mb-2" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardContent>
    </Card>
  )
}

function getProgressColor(variant?: StatVariant, percentage?: number): string {
  if (variant === "success") return "[&>div]:bg-emerald-500"
  if (variant === "warning") return "[&>div]:bg-amber-500"
  if (variant === "danger") return "[&>div]:bg-destructive"

  // Auto-color based on percentage
  if (percentage !== undefined) {
    if (percentage >= 90) return "[&>div]:bg-amber-500"
    if (percentage >= 75) return "[&>div]:bg-primary"
  }

  return "[&>div]:bg-primary"
}

function getTextColor(variant?: StatVariant, percentage?: number): string {
  if (variant === "success") return "text-emerald-600 dark:text-emerald-400"
  if (variant === "warning") return "text-amber-600 dark:text-amber-400"
  if (variant === "danger") return "text-destructive"

  if (percentage !== undefined && percentage >= 90) {
    return "text-amber-600 dark:text-amber-400"
  }

  return "text-primary"
}

function getStatusColor(variant?: StatVariant): string {
  if (variant === "success") return "text-emerald-600 dark:text-emerald-400"
  if (variant === "warning") return "text-amber-600 dark:text-amber-400"
  if (variant === "danger") return "text-destructive"
  return "text-muted-foreground"
}
