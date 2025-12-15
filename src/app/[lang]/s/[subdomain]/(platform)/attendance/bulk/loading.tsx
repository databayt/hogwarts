import { Skeleton } from '@/components/ui/skeleton'
import { SkeletonDataTable } from '@/components/ui/skeleton-data-table'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function AttendanceBulkLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-32" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-48" />
          </div>
        </CardContent>
      </Card>
      <SkeletonDataTable columns={8} rows={15} />
    </div>
  )
}
