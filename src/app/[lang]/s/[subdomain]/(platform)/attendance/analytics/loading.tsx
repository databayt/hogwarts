import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonStats } from "@/components/ui/skeleton-stats"
import { SkeletonCard } from "@/components/ui/skeleton-card"

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <Skeleton className="h-8 w-56" />

      {/* Stats cards */}
      <SkeletonStats count={5} />

      {/* Charts grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <SkeletonCard className="h-[400px]" />
        <SkeletonCard className="h-[400px]" />
        <SkeletonCard className="h-[400px]" />
        <SkeletonCard className="h-[400px]" />
      </div>
    </div>
  )
}
