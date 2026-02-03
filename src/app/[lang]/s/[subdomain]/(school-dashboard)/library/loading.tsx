import { Skeleton } from "@/components/ui/skeleton"
import {
  SkeletonDataTable,
  SkeletonPageNav,
  SkeletonStats,
} from "@/components/atom/loading"

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <Skeleton className="h-8 w-48" />

      {/* Navigation tabs */}
      <SkeletonPageNav tabs={4} />

      {/* Library stats */}
      <SkeletonStats count={4} />

      {/* Books data table */}
      <SkeletonDataTable columns={6} rows={15} />
    </div>
  )
}
