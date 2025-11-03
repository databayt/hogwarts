import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonPageNav } from "@/components/ui/skeleton-page-nav"
import { SkeletonStats } from "@/components/ui/skeleton-stats"
import { SkeletonCard } from "@/components/ui/skeleton-card"

export default function AttendanceLoading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <Skeleton className="h-8 w-48" />

      {/* Navigation tabs */}
      <SkeletonPageNav tabs={8} />

      {/* Stats cards */}
      <SkeletonStats count={4} />

      {/* Attendance method selection grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}
