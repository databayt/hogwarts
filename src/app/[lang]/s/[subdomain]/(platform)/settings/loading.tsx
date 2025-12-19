import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonFormSection, SkeletonPageNav } from "@/components/atom/loading"

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <Skeleton className="h-8 w-48" />

      {/* Navigation tabs */}
      <SkeletonPageNav tabs={5} />

      {/* Settings sections */}
      <div className="space-y-8">
        <SkeletonFormSection fields={3} />
        <SkeletonFormSection fields={4} />
        <SkeletonFormSection fields={2} />
      </div>
    </div>
  )
}
