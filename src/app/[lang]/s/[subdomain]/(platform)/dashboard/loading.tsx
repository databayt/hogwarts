import { Skeleton } from "@/components/ui/skeleton"
import {
  SkeletonChartGrid,
  SkeletonListCompact,
  SkeletonStats,
} from "@/components/atom/loading"

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <Skeleton className="h-8 w-48" />

      {/* KPI stats */}
      <SkeletonStats count={4} />

      {/* Charts */}
      <SkeletonChartGrid count={2} />

      {/* Recent activity */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-32" />
        <SkeletonListCompact items={5} />
      </div>
    </div>
  )
}
