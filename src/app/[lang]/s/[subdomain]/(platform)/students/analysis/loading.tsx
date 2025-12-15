import { Skeleton } from '@/components/ui/skeleton'
import { SkeletonStats } from '@/components/ui/skeleton-stats'
import { SkeletonChart } from '@/components/ui/skeleton-chart'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function StudentsAnalysisLoading() {
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
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
