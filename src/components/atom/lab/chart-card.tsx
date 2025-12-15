import * as React from "react"

import { cn } from "@/lib/utils"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import { StatGroup } from "./stat-group"
import type { CardSize, StatData } from "./types"

interface ChartCardProps {
  /**
   * Card title
   */
  title: string
  /**
   * Optional card description
   */
  description?: string
  /**
   * Chart component (e.g., Recharts)
   */
  chart: React.ReactNode
  /**
   * Optional footer stats
   */
  stats?: StatData[]
  /**
   * Optional action element (e.g., dropdown, filter button)
   */
  action?: React.ReactNode
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
   * Additional CSS classes
   */
  className?: string
}

/**
 * ChartCard - Chart display card with optional header and footer stats
 *
 * @example
 * ```tsx
 * <ChartCard
 *   title="Revenue Trends"
 *   description="Last 6 months"
 *   chart={<LineChart data={data} />}
 *   stats={[
 *     { value: "$45,678", label: "Total Revenue" },
 *     { value: "+23%", label: "Growth" }
 *   ]}
 *   action={<Button variant="ghost" size="sm">Export</Button>}
 *   size="lg"
 * />
 * ```
 */
export function ChartCard({
  title,
  description,
  chart,
  stats,
  action,
  size = "md",
  loading = false,
  className,
}: ChartCardProps) {
  const sizeClasses = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
    xl: "p-8",
  }

  return (
    <Card className={cn(className)}>
      <CardHeader className={cn(sizeClasses[size])}>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-32" />
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <CardTitle>{title}</CardTitle>
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            {action && <CardAction>{action}</CardAction>}
          </>
        )}
      </CardHeader>
      <CardContent className={cn(sizeClasses[size], "pt-0")}>
        {loading ? <Skeleton className="h-64 w-full rounded-lg" /> : chart}
      </CardContent>
      {stats && stats.length > 0 && (
        <CardFooter className={cn(sizeClasses[size], "pt-0")}>
          <div
            className={cn(
              "grid w-full gap-4",
              stats.length === 2 && "grid-cols-2",
              stats.length === 3 && "grid-cols-3",
              stats.length >= 4 && "grid-cols-2 md:grid-cols-4"
            )}
          >
            {loading
              ? [...Array(stats.length)].map((_, index) => (
                  <div key={index} className="space-y-1">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))
              : stats.map((stat, index) => (
                  <StatGroup
                    key={index}
                    value={stat.value}
                    label={stat.label}
                    trend={stat.trend}
                    layout="vertical"
                  />
                ))}
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
