import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonDataTable } from "@/components/ui/skeleton-data-table"

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <Skeleton className="h-8 w-48" />

      {/* Announcements data table */}
      <SkeletonDataTable columns={5} rows={10} />
    </div>
  )
}
