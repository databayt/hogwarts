import PageHeader from "@/components/atom/page-header"
import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonCard } from "@/components/ui/skeleton-card"

export default function FinanceLoading() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance"
        className="text-start max-w-none"
      />

      {/* PageNav skeleton */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-24" />
        ))}
      </div>

      {/* Finance cards grid - 13 total cards for all finance sub-blocks */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 13 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}
