import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonChart } from "@/components/ui/skeleton-chart"

export default function ChartsLoading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Charts grid */}
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonChart key={i} variant="bar" height="h-80" />
          ))}
        </div>
        <SkeletonChart variant="line" height="h-[500px]" />
        <SkeletonChart variant="area" height="h-[500px]" />
      </div>
    </div>
  )
}
