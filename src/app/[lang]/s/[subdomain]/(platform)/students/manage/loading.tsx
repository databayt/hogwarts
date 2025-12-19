import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonDataTable, SkeletonPageNav } from "@/components/atom/loading"

export default function StudentsManageLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <SkeletonPageNav tabs={4} />
      <SkeletonDataTable columns={7} rows={15} />
    </div>
  )
}
