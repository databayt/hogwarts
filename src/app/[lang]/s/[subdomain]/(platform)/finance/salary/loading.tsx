import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonCard, SkeletonStats } from "@/components/atom/loading"

export default function SalaryLoading() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <SkeletonStats count={4} />

      {/* Feature Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}
