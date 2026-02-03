import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonCard, SkeletonPageNav } from "@/components/atom/loading"

export default function ExamsLoading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <Skeleton className="h-8 w-48" />

      {/* Navigation tabs */}
      <SkeletonPageNav tabs={6} />

      {/* Exams cards grid - 9 total cards for all exam sub-blocks */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}
