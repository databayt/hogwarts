import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonDataTable, SkeletonStats } from "@/components/atom/loading"

export default function InvoiceDashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      {/* Stats Grid */}
      <SkeletonStats count={4} />

      {/* Recent Invoices Table */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <SkeletonDataTable
            columns={6}
            rows={5}
            showToolbar={false}
            showPagination={false}
          />
        </CardContent>
      </Card>
    </div>
  )
}
