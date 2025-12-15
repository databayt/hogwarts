import { Skeleton } from '@/components/ui/skeleton'
import { SkeletonPageNav } from '@/components/ui/skeleton-page-nav'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function ClassesSettingsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <SkeletonPageNav tabs={4} />
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          <Skeleton className="h-9 w-24 mt-4" />
        </CardContent>
      </Card>
    </div>
  )
}
