import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonFormSection } from "@/components/atom/loading"

export default function DashboardSettingsLoading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Settings sections */}
      <div className="divide-muted divide-y pb-10">
        <SkeletonFormSection fields={3} />
        <SkeletonFormSection fields={4} />
        <SkeletonFormSection fields={2} />
      </div>
    </div>
  )
}
