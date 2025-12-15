import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonChartGrid } from "@/components/ui/skeleton-chart"
import { SkeletonStats } from "@/components/ui/skeleton-stats"

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <SkeletonStats count={4} />
      <SkeletonChartGrid count={2} />
    </div>
  )
}
