import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonChartGrid } from "@/components/ui/skeleton-chart"
import { SkeletonListCompact } from "@/components/ui/skeleton-list"
import { SkeletonStats } from "@/components/ui/skeleton-stats"

export default function FinanceDashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <Skeleton className="h-8 w-64" />

      {/* KPI cards - 6 financial metrics */}
      <SkeletonStats count={6} />

      {/* Charts row - Revenue and Expense charts */}
      <SkeletonChartGrid count={2} />

      {/* Secondary row - Cash flow and Bank accounts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-[300px] w-full rounded-lg" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-[300px] w-full rounded-lg" />
        </div>
      </div>

      {/* Bottom row - Transactions and Quick actions */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <Skeleton className="h-6 w-44" />
          <SkeletonListCompact items={5} />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-6 w-28" />
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
