import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonChartGrid, SkeletonStats } from "@/components/atom/loading"

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <SkeletonStats count={4} />
      <SkeletonChartGrid count={2} />
    </div>
  )
}
