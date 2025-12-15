import { Skeleton } from '@/components/ui/skeleton'
import { SkeletonStats } from '@/components/ui/skeleton-stats'
import { SkeletonCard } from '@/components/ui/skeleton-card'

export default function BudgetLoading() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <SkeletonStats count={4} />

      {/* Feature Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}
