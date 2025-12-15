import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonCard } from "@/components/ui/skeleton-card"
import { SkeletonPageNavWide } from "@/components/ui/skeleton-page-nav"

export default function FinanceLoading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <Skeleton className="h-8 w-48" />

      {/* Navigation tabs */}
      <SkeletonPageNavWide tabs={7} />

      {/* Finance cards grid - 13 total cards for all finance sub-blocks */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 13 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}
