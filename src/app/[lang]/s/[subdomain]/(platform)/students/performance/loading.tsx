import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonDataTable } from "@/components/ui/skeleton-data-table"
import { SkeletonStats } from "@/components/ui/skeleton-stats"

export default function StudentsPerformanceLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <SkeletonStats count={4} />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[250px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[250px] w-full" />
          </CardContent>
        </Card>
      </div>
      <SkeletonDataTable columns={6} rows={10} />
    </div>
  )
}
