import { SkeletonPageNav } from "@/components/ui/skeleton-page-nav"
import { SkeletonFormSection } from "@/components/ui/skeleton-form"
import { Skeleton } from "@/components/ui/skeleton"

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
