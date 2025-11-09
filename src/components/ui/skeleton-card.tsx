import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * SkeletonCard Component
 *
 * Reusable skeleton loading state that matches the platform's standard card pattern.
 * Used across Finance, Exams, Admin, and other platform sections.
 *
 * Pattern matches:
 * - Icon (10x10 rounded-lg)
 * - Title (h6 size)
 * - Description (2 lines)
 * - Button/Link (h-9)
 *
 * @example
 * ```tsx
 * <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
 *   {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
 * </div>
 * ```
 */
export function SkeletonCard() {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-9 w-24" />
      </CardContent>
    </Card>
  )
}

/**
 * SkeletonCardCompact Component
 *
 * Compact version without description text, used for dense grids.
 *
 * @example
 * ```tsx
 * <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
 *   {Array.from({ length: 10 }).map((_, i) => <SkeletonCardCompact key={i} />)}
 * </div>
 * ```
 */
export function SkeletonCardCompact() {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-5 w-24" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20" />
      </CardContent>
    </Card>
  )
}

/**
 * SkeletonStatCard Component
 *
 * Stats card variant for lab metrics and key performance indicators.
 * Matches the typical stat card with label, value, and trend indicator.
 *
 * @example
 * ```tsx
 * <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
 *   {Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)}
 * </div>
 * ```
 */
export function SkeletonStatCard() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-3 w-24 mt-1" />
      </CardContent>
    </Card>
  )
}
