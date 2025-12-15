import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonList } from "@/components/ui/skeleton-list"
import { SkeletonPageNav } from "@/components/ui/skeleton-page-nav"
import { SkeletonStats } from "@/components/ui/skeleton-stats"

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <Skeleton className="h-8 w-48" />

      {/* Navigation tabs */}
      <SkeletonPageNav tabs={3} />

      {/* Stats cards */}
      <SkeletonStats count={3} columns="grid-cols-3" />

      {/* Notifications list */}
      <SkeletonList items={12} />
    </div>
  )
}
