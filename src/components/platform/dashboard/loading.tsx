import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * Loading skeleton for lab cards
 * Provides consistent loading experience across all dashboards
 */
export function DashboardCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="mb-2 h-8 w-[60px]" />
        <Skeleton className="h-3 w-[80px]" />
      </CardContent>
    </Card>
  )
}

/**
 * Loading skeleton for lab grid
 * Shows 4 cards in a grid layout
 */
export function DashboardGridSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <DashboardCardSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * Loading skeleton for activity cards
 */
export function ActivityCardSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-lg border p-3">
          <Skeleton className="mb-2 h-4 w-[200px]" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-[100px]" />
            <Skeleton className="h-5 w-[60px]" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Loading skeleton for table/list views
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-lg border p-3"
        >
          <div className="space-y-2">
            <Skeleton className="h-4 w-[150px]" />
            <Skeleton className="h-3 w-[100px]" />
          </div>
          <div className="space-y-2 text-right">
            <Skeleton className="ml-auto h-6 w-[60px]" />
            <Skeleton className="h-3 w-[80px]" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Full lab loading state
 */
export function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-4 w-[300px]" />
      </div>

      {/* Stats grid skeleton */}
      <DashboardGridSkeleton />

      {/* Quick actions skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[120px]" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-[140px]" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main content grid skeleton */}
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-[150px]" />
            </CardHeader>
            <CardContent>
              <ActivityCardSkeleton />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

/**
 * Loading state with custom message
 */
export function LoadingMessage({
  message = "Loading lab...",
}: {
  message?: string
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
      <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2" />
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  )
}
