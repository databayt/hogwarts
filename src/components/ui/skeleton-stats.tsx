import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

/**
 * SkeletonStats Component
 *
 * Skeleton for statistics/metrics row (lab KPIs).
 * Renders a responsive grid of stat cards.
 *
 * Pattern matches:
 * - Icon or label
 * - Large value number
 * - Trend indicator or change percentage
 *
 * @example
 * ```tsx
 * // Default 4 stats
 * <SkeletonStats />
 *
 * // Custom count
 * <SkeletonStats count={6} />
 * ```
 */
interface SkeletonStatsProps {
  /** Number of stat cards (default: 4) */
  count?: number
  /** Grid columns for different breakpoints (default: responsive 2-4) */
  columns?: string
  /** Additional CSS classes */
  className?: string
}

export function SkeletonStats({
  count = 4,
  columns = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  className,
}: SkeletonStatsProps) {
  return (
    <div className={cn("grid gap-4", columns, className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4 rounded" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-7 w-32 mb-1" />
            <Skeleton className="h-3 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/**
 * SkeletonStatsLarge Component
 *
 * Large stat cards with more detail (used in analytics dashboards).
 *
 * @example
 * ```tsx
 * <SkeletonStatsLarge count={3} />
 * ```
 */
export function SkeletonStatsLarge({
  count = 3,
  className,
}: Omit<SkeletonStatsProps, "columns">) {
  return (
    <div className={cn("grid gap-6 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-40" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/**
 * SkeletonStatsRow Component
 *
 * Horizontal stat row without cards (inline metrics).
 *
 * @example
 * ```tsx
 * <SkeletonStatsRow count={5} />
 * ```
 */
export function SkeletonStatsRow({
  count = 5,
  className,
}: Omit<SkeletonStatsProps, "columns">) {
  return (
    <div className={cn("flex items-center gap-8 border-y py-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>
      ))}
    </div>
  )
}
