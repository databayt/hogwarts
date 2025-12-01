import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonCard } from "@/components/ui/skeleton-card"

export default function ReportsLoading() {
  return (
    <div className="space-y-6">
      {/* Filters */}
      <SkeletonCard className="p-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      </SkeletonCard>

      {/* Table */}
      <SkeletonCard className="p-6">
        <div className="space-y-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </SkeletonCard>
    </div>
  )
}
