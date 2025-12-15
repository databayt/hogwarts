import { Skeleton } from '@/components/ui/skeleton'
import { SkeletonStats } from '@/components/ui/skeleton-stats'
import { SkeletonDataTable } from '@/components/ui/skeleton-data-table'

export default function ClassesCapacityLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <SkeletonStats count={4} />
      <SkeletonDataTable columns={6} rows={12} />
    </div>
  )
}
