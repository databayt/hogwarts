import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonCard, SkeletonStats } from "@/components/atom/loading"

export default function FeesLoading() {
  return (
    <div className="space-y-6">
      {/* Financial Overview - 4 stat cards */}
      <SkeletonStats count={4} />

      {/* Quick Actions - Feature Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}
