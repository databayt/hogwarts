import { Skeleton } from '@/components/ui/skeleton'
import { SkeletonStats } from '@/components/ui/skeleton-stats'
import { SkeletonCard } from '@/components/ui/skeleton-card'

export default function ReportsLoading() {
  return (
    <div className="space-y-6">
      {/* Stats Grid - Fewer stats for reports */}
      <SkeletonStats count={2} columns="grid-cols-1 sm:grid-cols-2" />

      {/* Report Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}
