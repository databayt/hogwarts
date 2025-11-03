import { SkeletonPageNav } from "@/components/ui/skeleton-page-nav"
import { SkeletonFormSection } from "@/components/ui/skeleton-form"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

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
              <div className="space-y-2 flex-1">
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
