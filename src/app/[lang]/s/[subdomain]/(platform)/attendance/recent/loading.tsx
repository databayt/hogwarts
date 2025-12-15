import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonDataTable } from "@/components/ui/skeleton-data-table"

export default function AttendanceRecentLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <SkeletonDataTable columns={6} rows={15} />
    </div>
  )
}
