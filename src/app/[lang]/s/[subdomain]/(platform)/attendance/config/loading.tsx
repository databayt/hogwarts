import { Skeleton } from '@/components/ui/skeleton'
import { SkeletonPageNav } from '@/components/ui/skeleton-page-nav'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function AttendanceConfigLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <SkeletonPageNav tabs={5} />
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b">
              <div className="space-y-1">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-6 w-12" />
            </div>
          ))}
          <Skeleton className="h-9 w-24 mt-4" />
        </CardContent>
      </Card>
    </div>
  )
}
