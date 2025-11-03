import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

/**
 * SkeletonChart Component
 *
 * Skeleton for chart components (Recharts, etc.).
 * Used in dashboards and analytics pages.
 *
 * Pattern matches:
 * - Chart title and description
 * - Chart area (bars, lines, pie)
 * - Legend at bottom
 *
 * @example
 * ```tsx
 * // Default bar chart
 * <SkeletonChart />
 *
 * // Line chart variant
 * <SkeletonChart variant="line" />
 * ```
 */
interface SkeletonChartProps {
  /** Chart type variant (default: "bar") */
  variant?: "bar" | "line" | "pie" | "area"
  /** Show chart wrapped in Card (default: true) */
  showCard?: boolean
  /** Chart height (default: "h-[300px]") */
  height?: string
  /** Additional CSS classes */
  className?: string
}

export function SkeletonChart({
  variant = "bar",
  showCard = true,
  height = "h-[300px]",
  className,
}: SkeletonChartProps) {
  const ChartContent = (
    <>
      {/* Chart title and description */}
      {showCard && (
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-full max-w-md" />
        </CardHeader>
      )}

      <CardContent className={cn(showCard && "pt-0")}>
        {/* Chart visualization area */}
        <div className={cn(height, "w-full relative")}>
          {variant === "bar" && <BarChartSkeleton />}
          {variant === "line" && <LineChartSkeleton />}
          {variant === "pie" && <PieChartSkeleton />}
          {variant === "area" && <AreaChartSkeleton />}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </CardContent>
    </>
  )

  if (showCard) {
    return <Card className={className}>{ChartContent}</Card>
  }

  return <div className={className}>{ChartContent}</div>
}

/** Bar chart skeleton visualization */
function BarChartSkeleton() {
  return (
    <div className="flex items-end justify-around gap-2 h-full pb-8">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2">
          <Skeleton
            className="w-full"
            style={{ height: `${Math.random() * 60 + 40}%` }}
          />
          <Skeleton className="h-3 w-8" />
        </div>
      ))}
    </div>
  )
}

/** Line chart skeleton visualization */
function LineChartSkeleton() {
  return (
    <div className="relative h-full">
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-8" />
        ))}
      </div>

      {/* Chart area */}
      <div className="ml-12 h-full flex flex-col">
        <div className="flex-1 relative">
          {/* Simulated line chart path */}
          <div className="absolute inset-0 flex items-center">
            <Skeleton className="h-1 w-full" />
          </div>
        </div>

        {/* X-axis labels */}
        <div className="flex justify-around pt-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-8" />
          ))}
        </div>
      </div>
    </div>
  )
}

/** Pie chart skeleton visualization */
function PieChartSkeleton() {
  return (
    <div className="flex items-center justify-center h-full">
      <Skeleton className="h-48 w-48 rounded-full" />
    </div>
  )
}

/** Area chart skeleton visualization */
function AreaChartSkeleton() {
  return (
    <div className="relative h-full">
      <div className="absolute inset-0 flex items-end justify-around gap-1">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1"
            style={{ height: `${Math.random() * 70 + 30}%` }}
          />
        ))}
      </div>
      {/* X-axis labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-around pt-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-8" />
        ))}
      </div>
    </div>
  )
}

/**
 * SkeletonChartGrid Component
 *
 * Grid of multiple charts (dashboard analytics).
 *
 * @example
 * ```tsx
 * <SkeletonChartGrid count={4} />
 * ```
 */
export function SkeletonChartGrid({
  count = 2,
  className,
}: {
  count?: number
  className?: string
}) {
  return (
    <div className={cn("grid gap-6 md:grid-cols-2", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonChart key={i} variant={i % 2 === 0 ? "bar" : "line"} />
      ))}
    </div>
  )
}
