import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonFormSection, SkeletonPageNav } from "@/components/atom/loading"

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <Skeleton className="h-8 w-48" />

      {/* Navigation tabs */}
      <SkeletonPageNav tabs={4} />

      {/* Profile sections */}
      <div className="space-y-6">
        {/* Avatar and basic info */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form sections */}
        <SkeletonFormSection fields={4} />
        <SkeletonFormSection fields={3} />
      </div>
    </div>
  )
}
