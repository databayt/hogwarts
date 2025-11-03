import { SkeletonDataTable } from "@/components/ui/skeleton-data-table"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <Skeleton className="h-8 w-48" />

      {/* Subjects data table */}
      <SkeletonDataTable columns={5} rows={10} />
    </div>
  )
}
