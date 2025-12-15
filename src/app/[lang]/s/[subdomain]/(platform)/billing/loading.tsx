import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonDataTable } from "@/components/ui/skeleton-data-table"
import { SkeletonStats } from "@/components/ui/skeleton-stats"

export default function AdminBillingLoading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <Skeleton className="h-8 w-48" />

      {/* Billing stats */}
      <SkeletonStats count={3} columns="grid-cols-3" />

      {/* Invoices/transactions table */}
      <SkeletonDataTable columns={6} rows={10} />
    </div>
  )
}
