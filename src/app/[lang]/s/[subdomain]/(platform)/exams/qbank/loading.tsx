import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonDataTable } from "@/components/ui/skeleton-data-table"
import { SkeletonPageNav } from "@/components/ui/skeleton-page-nav"
import { SkeletonStats } from "@/components/ui/skeleton-stats"

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <Skeleton className="h-8 w-48" />

      {/* Navigation tabs */}
      <SkeletonPageNav tabs={3} />

      {/* Question bank stats */}
      <SkeletonStats count={4} />

      {/* Questions data table */}
      <SkeletonDataTable columns={6} rows={15} />
    </div>
  )
}
