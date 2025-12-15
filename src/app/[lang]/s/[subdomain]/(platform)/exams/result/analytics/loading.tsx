import { Skeleton } from '@/components/ui/skeleton'
import { SkeletonStats } from '@/components/ui/skeleton-stats'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function ExamsResultAnalyticsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <SkeletonStats count={4} />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[200px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
