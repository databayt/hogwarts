import { Skeleton } from '@/components/ui/skeleton'
import { SkeletonDataTable } from '@/components/ui/skeleton-data-table'

export default function InvoiceListLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-32" />
      </div>

      {/* Invoice Table */}
      <SkeletonDataTable columns={7} rows={12} />
    </div>
  )
}
