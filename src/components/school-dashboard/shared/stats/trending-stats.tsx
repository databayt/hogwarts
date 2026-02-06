"use client"

import * as React from "react"
import { Minus, TrendingDown, TrendingUp } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import type { StatGridConfig, StatsDictionary, TrendingStatItem } from "./types"

interface TrendingStatsProps {
  /** Array of stat items to display */
  items: TrendingStatItem[]
  /** Grid configuration */
  grid?: StatGridConfig
  /** Visual style variant */
  variant?: "default" | "bordered" | "cards" | "badges"
  /** Loading state */
  loading?: boolean
  /** Dictionary for i18n */
  dictionary?: StatsDictionary
  /** Additional CSS classes */
  className?: string
  /** Click handler for stat items */
  onItemClick?: (item: TrendingStatItem, index: number) => void
}

/**
 * TrendingStats - Display metrics with trending indicators
 * Based on blocks.so stats-01/04 patterns
 *
 * @example
 * ```tsx
 * <TrendingStats
 *   items={[
 *     { label: "Total Students", value: 4812, change: 12, changeType: "positive" },
 *     { label: "Attendance", value: "94.5%", change: 2.1, changeType: "positive" },
 *   ]}
 *   variant="badges"
 * />
 * ```
 */
export function TrendingStats({
  items,
  grid = { mobile: 1, tablet: 2, desktop: 4 },
  variant = "default",
  loading = false,
  dictionary,
  className,
  onItemClick,
}: TrendingStatsProps) {
  const gridClasses = cn(
    "grid gap-4",
    grid.mobile === 1 ? "grid-cols-1" : "grid-cols-2",
    grid.tablet === 1 && "sm:grid-cols-1",
    grid.tablet === 2 && "sm:grid-cols-2",
    grid.tablet === 3 && "sm:grid-cols-3",
    grid.desktop === 1 && "lg:grid-cols-1",
    grid.desktop === 2 && "lg:grid-cols-2",
    grid.desktop === 3 && "lg:grid-cols-3",
    grid.desktop === 4 && "lg:grid-cols-4",
    grid.desktop === 5 && "lg:grid-cols-5"
  )

  if (loading) {
    return (
      <div className={cn(gridClasses, className)}>
        {Array.from({ length: items.length || 4 }).map((_, i) => (
          <TrendingStatSkeleton key={i} variant={variant} />
        ))}
      </div>
    )
  }

  // Bordered variant (stats-01 style)
  if (variant === "bordered") {
    return (
      <div
        className={cn(
          "bg-border grid grid-cols-1 gap-px rounded-xl sm:grid-cols-2 lg:grid-cols-4",
          className
        )}
      >
        {items.map((item, index) => (
          <Card
            key={item.label}
            className={cn(
              "rounded-none border-0 shadow-none",
              index === 0 && "rounded-s-xl",
              index === items.length - 1 && "rounded-e-xl",
              onItemClick &&
                "hover:bg-accent/50 cursor-pointer transition-colors"
            )}
            onClick={() => onItemClick?.(item, index)}
          >
            <CardContent className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 p-4 sm:p-6">
              <p className="text-muted-foreground truncate text-sm font-medium">
                {item.label}
              </p>
              {item.change !== undefined && (
                <span
                  className={cn(
                    "text-xs font-medium",
                    item.changeType === "positive"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-destructive"
                  )}
                >
                  {item.changeType === "positive" ? "+" : ""}
                  {item.change}%
                </span>
              )}
              <p className="text-foreground w-full flex-none text-3xl font-medium tracking-tight">
                {formatValue(item.value)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Badge variant (stats-04 style)
  if (variant === "badges") {
    return (
      <div className={cn(gridClasses, className)}>
        {items.map((item, index) => (
          <Card
            key={item.label}
            className={cn(
              "py-4",
              onItemClick &&
                "hover:bg-accent/50 cursor-pointer transition-colors"
            )}
            onClick={() => onItemClick?.(item, index)}
          >
            <CardContent className="p-4 pt-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {item.icon && (
                    <span className="text-muted-foreground">{item.icon}</span>
                  )}
                  <p className="text-muted-foreground text-sm font-medium">
                    {item.label}
                  </p>
                </div>
                {item.change !== undefined && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium",
                      item.changeType === "positive"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
                        : "bg-destructive/10 text-destructive border-destructive/20"
                    )}
                  >
                    {item.changeType === "positive" ? (
                      <TrendingUp className="h-3.5 w-3.5" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5" />
                    )}
                    <span className="sr-only">
                      {item.changeType === "positive"
                        ? "Increased"
                        : "Decreased"}{" "}
                      by
                    </span>
                    {item.changeType === "positive" ? "+" : ""}
                    {item.change}%
                  </Badge>
                )}
              </div>
              <p className="text-foreground mt-2 text-3xl font-semibold">
                {formatValue(item.value)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Cards variant (stats-03 style)
  if (variant === "cards") {
    return (
      <div className={cn(gridClasses, className)}>
        {items.map((item, index) => (
          <Card
            key={item.label}
            className={cn(
              "p-6 py-4",
              onItemClick &&
                "hover:bg-accent/50 cursor-pointer transition-colors"
            )}
            onClick={() => onItemClick?.(item, index)}
          >
            <CardContent className="p-0">
              <p className="text-muted-foreground text-sm font-medium">
                {item.label}
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-foreground text-3xl font-semibold">
                  {formatValue(item.value)}
                </span>
                {item.change !== undefined && (
                  <span
                    className={cn(
                      "text-sm font-medium",
                      item.changeType === "positive"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-destructive"
                    )}
                  >
                    {item.changeType === "positive" ? "+" : ""}
                    {item.change}%
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Default variant
  return (
    <div className={cn(gridClasses, className)}>
      {items.map((item, index) => (
        <Card
          key={item.label}
          className={cn(
            onItemClick && "hover:bg-accent/50 cursor-pointer transition-colors"
          )}
          onClick={() => onItemClick?.(item, index)}
        >
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm font-medium">
                {item.label}
              </p>
              {item.icon && (
                <span className="text-muted-foreground">{item.icon}</span>
              )}
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-foreground text-2xl font-bold">
                {formatValue(item.value)}
              </span>
              {item.change !== undefined && (
                <div
                  className={cn(
                    "flex items-center gap-0.5 text-xs font-medium",
                    item.changeType === "positive"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : item.changeType === "negative"
                        ? "text-destructive"
                        : "text-muted-foreground"
                  )}
                >
                  {item.changeType === "positive" ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : item.changeType === "negative" ? (
                    <TrendingDown className="h-3 w-3" />
                  ) : (
                    <Minus className="h-3 w-3" />
                  )}
                  {Math.abs(item.change)}%
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function TrendingStatSkeleton({ variant }: { variant: string }) {
  return (
    <Card className={cn(variant === "bordered" && "border-0 shadow-none")}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="mt-2 h-8 w-32" />
      </CardContent>
    </Card>
  )
}

function formatValue(value: string | number): string {
  if (typeof value === "number") {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    }
    if (value >= 1000) {
      return value.toLocaleString()
    }
    return value.toString()
  }
  return value
}
