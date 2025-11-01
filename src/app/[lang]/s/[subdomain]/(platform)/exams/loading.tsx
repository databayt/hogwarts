import PageHeader from "@/components/atom/page-header"
import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonCard } from "@/components/ui/skeleton-card"

export default function ExamsLoading() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Exams"
        className="text-start max-w-none"
      />

      {/* PageNav skeleton */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-24" />
        ))}
      </div>

      {/* Exams cards grid - 9 total cards for all exam sub-blocks */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}
